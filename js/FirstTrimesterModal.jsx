import React, { useState, useRef } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';

function FirstTrimesterModal({ patient, onClose, clinicDetails, token, totalRadiologyExams }) {
  const [isIntrauterine, setIsIntrauterine] = useState('');
  const [meanSacDiameter, setMeanSacDiameter] = useState('');
  const [fetalPole, setFetalPole] = useState('');
  const [fetalNode, setFetalNode] = useState('');
  const [isSacRegular, setIsSacRegular] = useState(false);
  const [isAmnioticFluidAdequate, setIsAmnioticFluidAdequate] = useState(false);
  const [periGestationalFluid, setPeriGestationalFluid] = useState('');
  const [myometrialMasses, setMyometrialMasses] = useState('');
  const [adnexalAbnormalities, setAdnexalAbnormalities] = useState('');
  const [freeFluidCollection, setFreeFluidCollection] = useState('');
  const [fluidType, setFluidType] = useState('');
  const [bladderAppearance, setBladderAppearance] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [editableReport, setEditableReport] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [gestationalDays, setGestationalDays] = useState('');
  const [printLoading, setPrintLoading] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport("Generating report...");
  
    const payload = {
      isIntrauterine: isIntrauterine || 'Not provided',
      meanSacDiameter: meanSacDiameter || 'Not provided',
      fetalPole: fetalPole === 'Yes' ? 'Fetal pole seen inside the sac' : 'No fetal pole seen',
      fetalNode: fetalNode === 'Yes' ? 'Fetal node seen inside the sac' : 'No fetal node seen',
      isSacRegular: isSacRegular ? 'The gestational sac is regular' : 'The gestational sac is irregular',
      isAmnioticFluidAdequate: isAmnioticFluidAdequate ? 'Amniotic fluid volume is adequate for age' : 'Amniotic fluid volume is inadequate for age',
      periGestationalFluid: periGestationalFluid || 'Not provided',
      myometrialMasses: myometrialMasses || 'Not provided',
      gestationalAge: `${gestationalWeeks || 'Not provided'} weeks and ${gestationalDays || 'Not provided'} days`,
      adnexalAbnormalities: adnexalAbnormalities || 'Not provided',
      freeFluidCollection: freeFluidCollection || 'Not provided',
      fluidType: freeFluidCollection === 'Yes' ? (fluidType === 'Physiological' ? 'Physiological' : 'Pathological') : 'Not provided',
      bladderAppearance: bladderAppearance || 'Not provided',
      expectedDeliveryDate: expectedDeliveryDate || 'Not provided',
      additionalInfo: additionalInfo || 'Not provided',
      reportDate: currentDate
    };
  
    try {
      const response = await fetch(urls.reportEarlyPregnancy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      const generatedReport = `Report Date: ${currentDate}\n\n${data.report}`;
      setReport(generatedReport);
      setEditableReport(generatedReport);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      setReport('');
      setEditableReport('');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setReport(editableReport);
    setIsEditing(false);
    toast.success('Report updated successfully');
  };

  const handleCancelEdit = () => {
    setEditableReport(report);
    setIsEditing(false);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        file_id: patient.file_id,
        contact_id: patient.contact_id,
        results: editableReport, // Use the editable version
        totalRadiologyExams,
        token,
      };

      const response = await fetch(urls.submitradiologyresults, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success('Radiology results submitted successfully!');
        if (window.confirm('Do you want to print a report?')) {
          handlePrint();
        } else {
          onClose();
        }
      } else {
        throw new Error('Failed to submit radiology results');
      }
    } catch (error) {
      console.error('Error submitting radiology results:', error);
      toast.error('Error submitting radiology results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    setPrintLoading(true);

    const printData = {
      clinicName: clinicDetails?.clinic_name || 'No Clinic Name Available',
      contact: clinicDetails?.owners_contact || 'No Contact Available',
      location: `${clinicDetails?.sub_county || ''}, ${clinicDetails?.district || ''}`,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientAge: patient.age,
      patientSex: patient.sex,
      radiologyTests: patient.radiology_exam || [],
      radiologyResults: editableReport.trim().split('\n').map(result => result.trim()), // Use the editable version
    };

    fetch(urls.pdfscan2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate PDF: ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('PDF report generated successfully!');
      })
      .catch(error => {
        console.error('PDF generation error:', error);
        toast.error('Failed to generate PDF report');
      })
      .finally(() => {
        setPrintLoading(false);
      });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '90%',
        maxWidth: '1200px',
        height: '90vh',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        display: 'flex',
      }}>
        {/* Left Panel - Form Sections */}
        <div style={{
          width: '50%',
          padding: '20px',
          overflowY: 'auto',
          borderRight: '1px solid #e0e0e0',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
            }}>
              First Trimester Ultrasound Report (4-7 weeks)
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Gestational Information Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: '#000000',
                fontSize: '18px',
                marginTop: 0,
                marginBottom: '15px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
              }}>
                Gestational Information
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Is the gestational sac seen?
                </label>
                <select 
                  value={isIntrauterine} 
                  onChange={(e) => setIsIntrauterine(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select Answer</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Mean Sac Diameter (mm):
                </label>
                <input 
                  type="text" 
                  value={meanSacDiameter} 
                  onChange={(e) => setMeanSacDiameter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal pole present?
                </label>
                <select 
                  value={fetalPole} 
                  onChange={(e) => setFetalPole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select Answer</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal node present?
                </label>
                <select 
                  value={fetalNode} 
                  onChange={(e) => setFetalNode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select Answer</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Sac Characteristics Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: '#000000',
                fontSize: '18px',
                marginTop: 0,
                marginBottom: '15px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
              }}>
                Sac Characteristics
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Gestational sac regularity
                </label>
                <select 
                  value={isSacRegular ? 'Yes' : 'No'} 
                  onChange={(e) => setIsSacRegular(e.target.value === 'Yes')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Regular</option>
                  <option value="No">Irregular</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Amniotic fluid volume
                </label>
                <select 
                  value={isAmnioticFluidAdequate} 
                  onChange={(e) => setIsAmnioticFluidAdequate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Adequate for age</option>
                  <option value="No">Inadequate for age</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Peri-gestational fluid
                </label>
                <select 
                  value={periGestationalFluid} 
                  onChange={(e) => setPeriGestationalFluid(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  
                  <option value="There is pergestational fluid collection seen. This refers to an impression of subchorionic hemorrhage">Present</option>
                  <option value="No perigestational fluid collection seen">Absent</option>
                </select>
              </div>
            </div>

            {/* Uterine Findings Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: '#000000',
                fontSize: '18px',
                marginTop: 0,
                marginBottom: '15px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
              }}>
                Uterine Findings
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Myometrial masses
                </label>
                <select 
                  value={myometrialMasses} 
                  onChange={(e) => setMyometrialMasses(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  <option value="there are myometrial masses seen">Present</option>
                  <option value="No myometrial masses seen">Absent</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Adnexal abnormalities
                </label>
                <select 
                  value={adnexalAbnormalities} 
                  onChange={(e) => setAdnexalAbnormalities(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Present</option>
                  <option value="No adnexial abnormalities seen">Absent</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Free fluid collection
                </label>
                <select 
                  value={freeFluidCollection} 
                  onChange={(e) => setFreeFluidCollection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Present</option>
                  <option value="No">Absent</option>
                </select>
              </div>

              {freeFluidCollection === 'Yes' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#000000',
                    fontWeight: '500',
                  }}>
                    Fluid type
                  </label>
                  <select 
                    value={fluidType} 
                    onChange={(e) => setFluidType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: '#fff',
                      fontSize: '14px',
                    }}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Physiological fluid collection is seen, this is sometimes seen in early pregnancy especially if there are no evident signs of PID">Physiological</option>
                    <option value="Pathological fluid is seen. This confirms PID">Pathological</option>
                    <option value="Free pelvic fluid collection is seen, Further investigations may be taken to find out if it's physiological or not">Undetermined</option>
                  </select>
                </div>
              )}
            </div>

            {/* Pregnancy Details Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: '#000000',
                fontSize: '18px',
                marginTop: 0,
                marginBottom: '15px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
              }}>
                Pregnancy Details
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Gestational Age (Weeks)
                </label>
                <input 
                  type="number" 
                  value={gestationalWeeks} 
                  onChange={(e) => setGestationalWeeks(e.target.value)} 
                  min="4"
                  max="7"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Gestational Age (Days)
                </label>
                <input 
                  type="number" 
                  value={gestationalDays} 
                  onChange={(e) => setGestationalDays(e.target.value)} 
                  min="0"
                  max="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Expected Delivery Date
                </label>
                <input 
                  type="date" 
                  value={expectedDeliveryDate} 
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: '#000000',
                fontSize: '18px',
                marginTop: 0,
                marginBottom: '15px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e0e0e0',
              }}>
                Additional Information
              </h2>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Enter any additional findings or notes..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#000000',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s',
                  ':hover': {
                    backgroundColor: '#333333',
                  },
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span>Generating Report...</span>
                ) : (
                  <span>Generate Report</span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s',
                  ':hover': {
                    backgroundColor: '#c0392b',
                  },
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel - Report Display */}
        <div style={{
          width: '50%',
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
            }}>
              Report Preview
            </h2>
            {report && !isEditing && (
              <button
                onClick={handleEditReport}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Edit Report
              </button>
            )}
          </div>

          <div style={{
            flex: 1,
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            overflowY: 'auto',
          }}>
            {report ? (
              isEditing ? (
                <textarea
                  value={editableReport}
                  onChange={(e) => setEditableReport(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '300px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              ) : (
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#333',
                }}>
                  {report}
                </pre>
              )
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#7f8c8d',
                fontStyle: 'italic',
              }}>
                Report will appear here after generation
              </div>
            )}
          </div>

          {report && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
            }}>
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    style={{
                      backgroundColor: '#27ae60',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSubmitReport}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#000000',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FirstTrimesterModal;