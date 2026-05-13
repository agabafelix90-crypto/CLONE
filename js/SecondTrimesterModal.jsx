import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';

function SecondTrimesterModal({ patient, onClose, clinicDetails, token, totalRadiologyExams }) {
  const [fetusIntraUterine, setFetusIntraUterine] = useState('');
  const [fetalCardiacActivity, setFetalCardiacActivity] = useState('');
  const [fetalMovements, setFetalMovements] = useState('');
  const [amnioticFluidVolume, setAmnioticFluidVolume] = useState('');
  const [fetalHeadTrunkLimbs, setFetalHeadTrunkLimbs] = useState('');
  const [perigestationalFluid, setPerigestationalFluid] = useState('');
  const [crownToRumpLength, setCrownToRumpLength] = useState('');
  const [myometrialAbnormalities, setMyometrialAbnormalities] = useState('');
  const [adnexialAbnormalities, setAdnexialAbnormalities] = useState('');
  const [pelvicFluidCollection, setPelvicFluidCollection] = useState('');
  const [gestationalWeeks, setGestationalWeeks] = useState('');
  const [gestationalDays, setGestationalDays] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [editableReport, setEditableReport] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      fetusIntraUterine: fetusIntraUterine || 'Not provided',
      fetalCardiacActivity: fetalCardiacActivity || 'Not provided',
      fetalMovements: fetalMovements || 'Not provided',
      amnioticFluidVolume: amnioticFluidVolume || 'Not provided',
      fetalHeadTrunkLimbs: fetalHeadTrunkLimbs || 'Not provided',
      perigestationalFluid: perigestationalFluid || 'Not provided',
      crownToRumpLength: crownToRumpLength || 'Not provided',
      myometrialAbnormalities: myometrialAbnormalities || 'Not provided',
      adnexialAbnormalities: adnexialAbnormalities || 'Not provided',
      pelvicFluidCollection: pelvicFluidCollection || 'Not provided',
      gestationalAge: `${gestationalWeeks || 'Not provided'} weeks and ${gestationalDays || 'Not provided'} days`,
      expectedDeliveryDate: expectedDeliveryDate || 'Not provided',
      additionalInfo: additionalInfo || 'No abnormalities noted. General instructions followed.',
      reportDate: currentDate
    };

    try {
      const response = await fetch(urls.generateObsReport2nd, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const generatedReport = `Report Date: ${currentDate}\n\n${data.report}`;
      setReport(generatedReport);
      setEditableReport(generatedReport); // Initialize editable report with the generated one
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
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
        results: report, // Use the final report (edited or original)
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
      radiologyResults: report.trim().split('\n').map(result => result.trim()),
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
              Second Trimester Ultrasound Report
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Fetal Information Section */}
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
                Fetal Information
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Is the fetus intrauterine?
                </label>
                <select 
                  value={fetusIntraUterine} 
                  onChange={(e) => setFetusIntraUterine(e.target.value)}
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
                  Fetal cardiac activity?
                </label>
                <select 
                  value={fetalCardiacActivity} 
                  onChange={(e) => setFetalCardiacActivity(e.target.value)}
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
                  Fetal movements present?
                </label>
                <select 
                  value={fetalMovements} 
                  onChange={(e) => setFetalMovements(e.target.value)}
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
                  Amniotic fluid volume adequate?
                </label>
                <select 
                  value={amnioticFluidVolume} 
                  onChange={(e) => setAmnioticFluidVolume(e.target.value)}
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
                  Fetal head, trunk, and limbs present?
                </label>
                <select 
                  value={fetalHeadTrunkLimbs} 
                  onChange={(e) => setFetalHeadTrunkLimbs(e.target.value)}
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
                  Perigestational fluid present?
                </label>
                <select 
                  value={perigestationalFluid} 
                  onChange={(e) => setPerigestationalFluid(e.target.value)}
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
                  Crown to rump length (mm):
                </label>
                <input 
                  type="text" 
                  value={crownToRumpLength} 
                  onChange={(e) => setCrownToRumpLength(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Uterine and Adnexial Information Section */}
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
                Uterine and Adnexial Information
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Myometrial abnormalities?
                </label>
                <select 
                  value={myometrialAbnormalities} 
                  onChange={(e) => setMyometrialAbnormalities(e.target.value)}
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
                  Adnexial abnormalities?
                </label>
                <select 
                  value={adnexialAbnormalities} 
                  onChange={(e) => setAdnexialAbnormalities(e.target.value)}
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
                  Pelvic fluid collection?
                </label>
                <select 
                  value={pelvicFluidCollection} 
                  onChange={(e) => setPelvicFluidCollection(e.target.value)}
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
                {loading ? 'Generating Report...' : 'Generate Report'}
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
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
            }}>
              Report Preview
            </h2>
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
                    resize: 'none',
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

          <div style={{
            fontSize: '12px',
            color: '#555',
            margin: '10px 0',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Report generator can make mistakes, consider checking and editing this information.
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
                    Cancel Edit
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleEditReport}
                    style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginRight: 'auto',
                    }}
                  >
                    Edit Report
                  </button>
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

export default SecondTrimesterModal;