import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { urls } from './config.dev';

function DischargeForm() {
    const { token, fileId } = useParams();
    const location = useLocation();
    const [fileData, setFileData] = useState(null);
    const [clinicDetails, setClinicDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        dateOfAdmission: '',
        dateOfDischarge: '',
        diagnosis: '',
        clinicalSummary: '',
        investigationsSummary: '',
        managementSummary: '',
        dischargeRecommendations: '',
        followUpDate: '',
        doctorName: '',
        signature: '',
        date: new Date().toISOString().split('T')[0]
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
            } catch (error) {
                console.error('Error fetching clinic details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClinicDetails();

        if (location.state?.fileData) {
            setFileData(location.state.fileData);
            const admissionDate = location.state.fileData.fileData.date_created?.split('T')[0] || '';
            setFormData(prev => ({
                ...prev,
                dateOfAdmission: admissionDate,
                diagnosis: location.state.fileData.fileData.diagnosis || '',
                managementSummary: location.state.fileData.fileData.treatment_plan || ''
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
        return text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    const downloadPDF = () => {
        const input = pdfRef.current;
        
        // Hide all textareas and show the display divs before capturing
        const textareas = input.querySelectorAll('textarea');
        const displayDivs = input.querySelectorAll('.display-content');
        
        textareas.forEach(textarea => textarea.style.display = 'none');
        displayDivs.forEach(div => div.style.display = 'block');
        
        // Set a fixed width for PDF generation
        const originalWidth = input.style.width;
        input.style.width = '210mm';
        
        // Add page-break classes to sections
        const sections = input.querySelectorAll('.pdf-section');
        sections.forEach(section => {
            section.classList.add('pdf-page-break');
        });
        
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
            textareas.forEach(textarea => textarea.style.display = 'block');
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

    const formatAge = () => {
        if (!fileData?.fileData) return '';
        
        const { age, age_months, age_weeks } = fileData.fileData;
        let ageString = `${age} years`;
        
        if (age_months > 0) {
            ageString += `, ${age_months} months`;
        }
        if (age_weeks > 0) {
            ageString += `, ${age_weeks} weeks`;
        }
        
        return ageString;
    };

    const renderTextareaField = (name, label, value) => (
        <div style={{ marginBottom: '20px', width: '100%' }}>
            <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                fontSize: '16px'
            }}>{label}:</label>
            
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
                    border: 'none'
                }}
            >
                {renderWithLineBreaks(value)}
            </div>
        </div>
    );

    const renderInputField = (name, label, value, type = 'text') => (
        <div style={{ marginBottom: '15px' }}>
            <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                fontSize: '16px'
            }}>{label}:</label>
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
                    border: 'none'
                }}
            >
                {value}
            </div>
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
                }}>DISCHARGE FORM</h1>
                
                {fileData ? (
                    <div>
                        <div ref={pdfRef} style={{ 
                            padding: '25px',
                            backgroundColor: 'white',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            {/* Header Section */}
                            <div className="pdf-section" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '40px',
                                width: '100%'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ 
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        marginBottom: '10px',
                                        color: '#000',
                                        wordBreak: 'break-word'
                                    }}>{clinicDetails?.clinic_name || 'LIFESURE MEDICARE'}</h2>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>{clinicDetails?.sub_county || 'BULAGA'}, {clinicDetails?.district || 'WAKISO'}</p>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>Contact: {clinicDetails?.owners_contact || '+256 753194824'}</p>
                                </div>
                                <div style={{ 
                                    flex: 1,
                                    textAlign: 'right'
                                }}>
                                    <p style={{ fontSize: '14px', wordBreak: 'break-word' }}><strong>File ID:</strong> {fileData.fileData.file_id}</p>
                                </div>
                            </div>

                            {/* Patient Information */}
                            <div className="pdf-section" style={{ 
                                marginBottom: '40px',
                                width: '100%'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '15px',
                                    color: '#000',
                                    borderBottom: '1px solid #000',
                                    paddingBottom: '5px'
                                }}>PATIENT INFORMATION</h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '15px',
                                    width: '100%'
                                }}>
                                    <div>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>Name:</strong> {fileData.fileData.first_name} {fileData.fileData.last_name}</p>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>Age:</strong> {formatAge()}</p>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>Address:</strong> {fileData.fileData.address}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>OPD No:</strong> {fileData.fileData.opd_no}</p>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>Sex:</strong> {fileData.fileData.sex}</p>
                                        <p style={{ margin: '5px 0', wordBreak: 'break-word' }}><strong>Contact:</strong> {fileData.fileData.phone_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admission Details */}
                            <div className="pdf-section" style={{ 
                                marginBottom: '40px',
                                width: '100%'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '15px',
                                    color: '#000',
                                    borderBottom: '1px solid #000',
                                    paddingBottom: '5px'
                                }}>ADMISSION DETAILS</h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    width: '100%'
                                }}>
                                    {renderInputField("dateOfAdmission", "Date of Admission", formData.dateOfAdmission, "date")}
                                    {renderInputField("dateOfDischarge", "Date of Discharge", formData.dateOfDischarge, "date")}
                                </div>
                            </div>

                            {/* Medical Information */}
                            <div className="pdf-section" style={{ marginBottom: '40px', width: '100%' }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '15px',
                                    color: '#000',
                                    borderBottom: '1px solid #000',
                                    paddingBottom: '5px'
                                }}>MEDICAL INFORMATION</h2>

                                {renderTextareaField("diagnosis", "Diagnosis", formData.diagnosis)}
                                {renderTextareaField("clinicalSummary", "Clinical Summary", formData.clinicalSummary)}
                                {renderTextareaField("investigationsSummary", "Summary of Investigations Done and Results", formData.investigationsSummary)}
                                {renderTextareaField("managementSummary", "Summary of Management in Hospital", formData.managementSummary)}
                                {renderTextareaField("dischargeRecommendations", "Discharge Recommendations", formData.dischargeRecommendations)}
                            </div>

                            {/* Follow-up Information */}
                            <div className="pdf-section" style={{ marginBottom: '40px', width: '100%' }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '15px',
                                    color: '#000',
                                    borderBottom: '1px solid #000',
                                    paddingBottom: '5px'
                                }}>FOLLOW-UP INFORMATION</h2>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    marginBottom: '20px',
                                    width: '100%'
                                }}>
                                    {renderInputField("followUpDate", "Follow-up Date", formData.followUpDate, "date")}
                                    {renderInputField("doctorName", "Name of Doctor", formData.doctorName)}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    width: '100%'
                                }}>
                                    {renderInputField("signature", "Signature", formData.signature)}
                                    {renderInputField("date", "Date", formData.date, "date")}
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

            {/* CSS for PDF generation */}
            <style>
                {`
                    @media print {
                        .pdf-page-break {
                            page-break-before: always;
                            padding-top: 20mm;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default DischargeForm;