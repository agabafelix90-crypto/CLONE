import React, { useState, useEffect } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';

function ThirdTrimesterModal({ patient, onClose, clinicDetails, token, totalRadiologyExams }) {
  // Presentation and Position States
  const [presentation, setPresentation] = useState('');
  const [position, setPosition] = useState('');
  
  // Fetal Information States
  const [fetalLie, setFetalLie] = useState('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('');
  const [gestationalAgeDays, setGestationalAgeDays] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [fetalWeight, setFetalWeight] = useState('');
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [heartRateMethod, setHeartRateMethod] = useState('');
  const [measuredFHR, setMeasuredFHR] = useState(false);
  const [fhrNormal, setFhrNormal] = useState(false);
  const [includeFHRFigure, setIncludeFHRFigure] = useState(true);
  
  // Fetal Anatomy States
  const [threeChamberedHeart, setThreeChamberedHeart] = useState(true);
  const [headAnatomyNormal, setHeadAnatomyNormal] = useState(true);
  const [abdominalAnatomyNormal, setAbdominalAnatomyNormal] = useState(true);
  const [spineIntact, setSpineIntact] = useState(true);
  const [stomachBubbleSeen, setStomachBubbleSeen] = useState(true);
  const [urinaryBladderSeen, setUrinaryBladderSeen] = useState(true);
  const [threeVesselCord, setThreeVesselCord] = useState(true);
  const [anatomyComments, setAnatomyComments] = useState('');
  
  // Maternal Anatomy States
  const [maternalKidneysNormal, setMaternalKidneysNormal] = useState(true);
  const [maternalKidneysComments, setMaternalKidneysComments] = useState('');
  
  // Amniotic Fluid States
  const [amnioticFluidAdequate, setAmnioticFluidAdequate] = useState(true);
  const [deepestVerticalPocket, setDeepestVerticalPocket] = useState('');
  const [amnioticFluidIndex, setAmnioticFluidIndex] = useState('');
  const [amnioticFluidComments, setAmnioticFluidComments] = useState('');
  
  // Placenta States
  const [placentaLocation, setPlacentaLocation] = useState('');
  const [placentaLowLying, setPlacentaLowLying] = useState('normal');
  const [placentaComments, setPlacentaComments] = useState('');
  
  // Cervix States
  const [cervixClosed, setCervixClosed] = useState(true);
  const [cervixComments, setCervixComments] = useState('');
  
  // Fetal Biometry States
  const [bpd, setBpd] = useState('');
  const [hc, setHc] = useState('');
  const [ac, setAc] = useState('');
  const [fl, setFl] = useState('');
  const [useBiometry, setUseBiometry] = useState(false);
  
  // Other States
  const [nuchalCord, setNuchalCord] = useState('');
  const [abnormalities, setAbnormalities] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [editableReport, setEditableReport] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    if (report) {
      setEditableReport(report);
    }
  }, [report]);

  const buildPayload = () => {
    const payload = {};
    
    if (presentation) payload.presentation = presentation;
    if (position) payload.position = position;
    if (fetalLie) payload.fetalLie = fetalLie;
    
    if (gestationalAgeWeeks || gestationalAgeDays) {
      const weeks = gestationalAgeWeeks || "not provided";
      const days = gestationalAgeDays || "not provided";
      payload.gestationalAge = `${weeks} weeks and ${days} days`;
    }
    
    if (expectedDeliveryDate) payload.expectedDeliveryDate = expectedDeliveryDate;
    if (fetalWeight) payload.fetalWeight = fetalWeight;
    
    // Fetal heart rate logic
    if (measuredFHR) {
      if (fhrNormal) {
        payload.fetalHeartRate = "Fetal heart rate is normal as demonstrated by M-mode";
      } else if (fetalHeartRate && heartRateMethod && includeFHRFigure) {
        payload.fetalHeartRate = `${fetalHeartRate} bpm (measured by ${heartRateMethod})`;
      } else if (!includeFHRFigure) {
        payload.fetalHeartRate = `Fetal heart rate is normal (measured by ${heartRateMethod})`;
      }
    }
    
    // Fetal anatomy
    if (!threeChamberedHeart) payload.threeChamberedHeart = "Abnormal three-chambered heart";
    if (!headAnatomyNormal) payload.headAnatomy = "Abnormal head anatomy";
    if (!abdominalAnatomyNormal) payload.abdominalAnatomy = "Abnormal abdominal anatomy";
    if (!spineIntact) payload.spine = "Spine not intact";
    if (!stomachBubbleSeen) payload.stomachBubble = "Stomach bubble not seen";
    if (!urinaryBladderSeen) payload.urinaryBladder = "Urinary bladder not seen";
    if (!threeVesselCord) payload.umbilicalCord = "Abnormal umbilical cord";
    if (anatomyComments) payload.anatomyComments = anatomyComments;
    
    // Maternal kidneys
    if (!maternalKidneysNormal) {
      payload.maternalKidneys = "Maternal kidneys appear abnormal";
      if (maternalKidneysComments) payload.maternalKidneysComments = maternalKidneysComments;
    } else {
      payload.maternalKidneys = "Maternal kidneys appear normal";
    }
    
    // Amniotic fluid
    if (!amnioticFluidAdequate) {
      payload.amnioticFluid = "Amniotic fluid volume is inadequate";
    }
    if (deepestVerticalPocket) payload.deepestVerticalPocket = deepestVerticalPocket;
    if (amnioticFluidIndex) payload.amnioticFluidIndex = amnioticFluidIndex;
    if (amnioticFluidComments) payload.amnioticFluidComments = amnioticFluidComments;
    
    // Placenta
    if (placentaLocation) payload.placentaLocation = placentaLocation;
    if (placentaLowLying === 'low') {
      payload.placentaLowLying = "Low-lying placenta noted";
    } else if (placentaLowLying === 'not-low') {
      payload.placentaLowLying = "Placenta is not low-lying";
    }
    if (placentaComments) payload.placentaComments = placentaComments;
    
    // Cervix
    if (!cervixClosed) payload.cervixStatus = "Cervix appears open";
    if (cervixComments) payload.cervixComments = cervixComments;
    
    // Biometry
    if (useBiometry) {
      const biometry = [];
      if (bpd) biometry.push(`BPD: ${bpd}mm`);
      if (hc) biometry.push(`HC: ${hc}mm`);
      if (ac) biometry.push(`AC: ${ac}mm`);
      if (fl) biometry.push(`FL: ${fl}mm`);
      
      if (biometry.length > 0) {
        payload.biometry = biometry.join(', ');
      }
    }
    
    // Other findings
    if (nuchalCord) payload.nuchalCord = nuchalCord;
    if (abnormalities) payload.abnormalities = abnormalities;
    
    payload.reportDate = currentDate;
    
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport("Generating report...");

    const payload = buildPayload();

    try {
      const response = await fetch(urls.generateObsReport, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setReport(`Report Date: ${currentDate}\n\n${data.report}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        file_id: patient.file_id,
        contact_id: patient.contact_id,
        results: editableReport,
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
      radiologyResults: editableReport.trim().split('\n').map(result => result.trim()),
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
              Third Trimester Ultrasound Report
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Presentation and Position Section */}
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
                Fetal Presentation and Position
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal Presentation:
                </label>
                <select 
                  value={presentation} 
                  onChange={(e) => setPresentation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Presentation</option>
                  <option value="Cephalic">Cephalic</option>
                  <option value="Breech">Breech</option>
                  <option value="Changing presentations">Changing presentations</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal Position:
                </label>
                <select 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Position</option>
                  <option value="Right occipital anterior position">Right occipital anterior position</option>
                  <option value="Left occipital anterior position">Left occipital anterior position</option>
                  <option value="Occipital anterior position">Occipital anterior position</option>
                  <option value="Occipital posterior position">Occipital posterior position</option>
                  <option value="Right occipital posterior position">Right occipital posterior position</option>
                  <option value="Left occipital posterior position">Left occipital posterior position</option>
                  <option value="Sacral anterior">Sacral anterior</option>
                  <option value="Sacral posterior">Sacral posterior</option>
                  <option value="Right sacral anterior">Right sacral anterior</option>
                  <option value="Left sacral anterior">Left sacral anterior</option>
                  <option value="Right sacral posterior">Right sacral posterior</option>
                  <option value="Left sacral posterior">Left sacral posterior</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal Lie:
                </label>
                <select 
                  value={fetalLie} 
                  onChange={(e) => setFetalLie(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Lie</option>
                  <option value="Longitudinal lie">Longitudinal lie</option>
                  <option value="Transverse lie with fetal head at maternal right">Transverse lie with fetal head at maternal right</option>
                  <option value="Transverse lie with fetal head at maternal left">Transverse lie with fetal head at maternal left</option>
                  <option value="Oblique lie with fetal head at maternal right">Oblique lie with fetal head at maternal right</option>
                  <option value="Oblique lie with fetal head at maternal left">Oblique lie with fetal head at maternal left</option>
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
                  Gestational Age (Weeks):
                </label>
                <input 
                  type="number" 
                  value={gestationalAgeWeeks} 
                  onChange={(e) => setGestationalAgeWeeks(e.target.value)}
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
                  Gestational Age (Days):
                </label>
                <input 
                  type="number" 
                  value={gestationalAgeDays} 
                  onChange={(e) => setGestationalAgeDays(e.target.value)}
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
                  Expected Delivery Date:
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
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Fetal Weight (kg):
                </label>
                <input 
                  type="text" 
                  value={fetalWeight} 
                  onChange={(e) => setFetalWeight(e.target.value)} 
                  placeholder="Enter fetal weight in kg"
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

            {/* Updated Fetal Heart Rate Section */}
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
                Fetal Heart Rate
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={measuredFHR} 
                    onChange={(e) => setMeasuredFHR(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Measured Fetal Heart Rate
                </label>
              </div>

              {measuredFHR && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#000000',
                      fontWeight: '500',
                    }}>
                      <input 
                        type="checkbox" 
                        checked={fhrNormal} 
                        onChange={(e) => setFhrNormal(e.target.checked)}
                        style={{
                          marginRight: '10px',
                        }}
                      />
                      Fetal heart rate is normal
                    </label>
                  </div>

                  {fhrNormal ? (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#000000',
                        fontWeight: '500',
                      }}>
                        Measurement Method:
                      </label>
                      <select 
                        value={heartRateMethod} 
                        onChange={(e) => setHeartRateMethod(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          backgroundColor: '#fff',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select Method</option>
                        <option value="M-mode">M-mode</option>
                        <option value="Doppler">Doppler</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#000000',
                          fontWeight: '500',
                        }}>
                          <input 
                            type="checkbox" 
                            checked={includeFHRFigure} 
                            onChange={(e) => setIncludeFHRFigure(e.target.checked)}
                            style={{
                              marginRight: '10px',
                            }}
                          />
                          Include actual fetal heart rate figure
                        </label>
                      </div>

                      {includeFHRFigure && (
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#000000',
                            fontWeight: '500',
                          }}>
                            Fetal Heart Rate (bpm):
                          </label>
                          <input 
                            type="number" 
                            value={fetalHeartRate} 
                            onChange={(e) => setFetalHeartRate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                            }}
                          />
                        </div>
                      )}

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '5px',
                          color: '#000000',
                          fontWeight: '500',
                        }}>
                          Measurement Method:
                        </label>
                        <select 
                          value={heartRateMethod} 
                          onChange={(e) => setHeartRateMethod(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fff',
                            fontSize: '14px',
                          }}
                        >
                          <option value="">Select Method</option>
                          <option value="M-mode">M-mode</option>
                          <option value="Doppler">Doppler</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Fetal Anatomy Section */}
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
                Fetal Anatomy Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={threeChamberedHeart} 
                    onChange={(e) => setThreeChamberedHeart(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Normal three-chambered heart seen
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={headAnatomyNormal} 
                    onChange={(e) => setHeadAnatomyNormal(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Normal head anatomy
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={abdominalAnatomyNormal} 
                    onChange={(e) => setAbdominalAnatomyNormal(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Normal abdominal anatomy
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={spineIntact} 
                    onChange={(e) => setSpineIntact(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Intact spine
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={stomachBubbleSeen} 
                    onChange={(e) => setStomachBubbleSeen(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Stomach bubble seen
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={urinaryBladderSeen} 
                    onChange={(e) => setUrinaryBladderSeen(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Urinary bladder seen
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={threeVesselCord} 
                    onChange={(e) => setThreeVesselCord(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Three-vessel umbilical cord with normal attachment
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Anatomy Comments:
                </label>
                <textarea
                  value={anatomyComments}
                  onChange={(e) => setAnatomyComments(e.target.value)}
                  placeholder="Enter any comments about fetal anatomy..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Maternal Kidneys Section */}
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
                Maternal Kidneys Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={maternalKidneysNormal} 
                    onChange={(e) => setMaternalKidneysNormal(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Maternal kidneys appear normal
                </label>
              </div>

              {!maternalKidneysNormal && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#000000',
                    fontWeight: '500',
                  }}>
                    Abnormalities Description:
                  </label>
                  <textarea
                    value={maternalKidneysComments}
                    onChange={(e) => setMaternalKidneysComments(e.target.value)}
                    placeholder="Describe any abnormalities found in maternal kidneys..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Amniotic Fluid Section */}
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
                Amniotic Fluid Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={amnioticFluidAdequate} 
                    onChange={(e) => setAmnioticFluidAdequate(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Amniotic fluid volume is adequate
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Deepest Vertical Pocket (cm):
                </label>
                <input 
                  type="text" 
                  value={deepestVerticalPocket} 
                  onChange={(e) => setDeepestVerticalPocket(e.target.value)}
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
                  Amniotic Fluid Index (cm):
                </label>
                <input 
                  type="text" 
                  value={amnioticFluidIndex} 
                  onChange={(e) => setAmnioticFluidIndex(e.target.value)}
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
                  Amniotic Fluid Comments:
                </label>
                <textarea
                  value={amnioticFluidComments}
                  onChange={(e) => setAmnioticFluidComments(e.target.value)}
                  placeholder="Enter any comments about amniotic fluid..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Updated Placenta Section */}
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
                Placenta Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Placenta Location:
                </label>
                <select 
                  value={placentaLocation} 
                  onChange={(e) => setPlacentaLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Location</option>
                  <option value="Fundal Anterior">Fundal Anterior</option>
                  <option value="Fundal Posterior">Fundal Posterior</option>
                  <option value="Anterior not Fundal">Anterior not Fundal</option>
                  <option value="Posterior not Fundal">Posterior not Fundal</option>
                  <option value="Right Lateral">Right Lateral</option>
                   <option value="Left Lateral">Left Lateral</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Placenta Position:
                </label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="radio" 
                      name="placentaLowLying" 
                      value="normal" 
                      checked={placentaLowLying === 'normal'} 
                      onChange={(e) => setPlacentaLowLying(e.target.value)}
                      style={{ marginRight: '5px' }}
                    />
                    Normal position
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="radio" 
                      name="placentaLowLying" 
                      value="low" 
                      checked={placentaLowLying === 'low'} 
                      onChange={(e) => setPlacentaLowLying(e.target.value)}
                      style={{ marginRight: '5px' }}
                    />
                    Low-lying placenta
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="radio" 
                      name="placentaLowLying" 
                      value="not-low" 
                      checked={placentaLowLying === 'not-low'} 
                      onChange={(e) => setPlacentaLowLying(e.target.value)}
                      style={{ marginRight: '5px' }}
                    />
                    Not low-lying
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Placenta Comments:
                </label>
                <textarea
                  value={placentaComments}
                  onChange={(e) => setPlacentaComments(e.target.value)}
                  placeholder="Enter any comments about placenta..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Cervix Section */}
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
                Cervix Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={cervixClosed} 
                    onChange={(e) => setCervixClosed(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Cervix appears closed
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Cervix Comments:
                </label>
                <textarea
                  value={cervixComments}
                  onChange={(e) => setCervixComments(e.target.value)}
                  placeholder="Enter any comments about cervix..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Fetal Biometry Section */}
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
                Fetal Biometry
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  <input 
                    type="checkbox" 
                    checked={useBiometry} 
                    onChange={(e) => setUseBiometry(e.target.checked)}
                    style={{
                      marginRight: '10px',
                    }}
                  />
                  Include fetal biometry measurements
                </label>
              </div>

              {useBiometry && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '5px',
                      color: '#000000',
                      fontWeight: '500',
                    }}>
                      Biparietal Diameter (BPD) (mm):
                    </label>
                    <input 
                      type="text" 
                      value={bpd} 
                      onChange={(e) => setBpd(e.target.value)}
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
                      Head Circumference (HC) (mm):
                    </label>
                    <input 
                      type="text" 
                      value={hc} 
                      onChange={(e) => setHc(e.target.value)}
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
                      Abdominal Circumference (AC) (mm):
                    </label>
                    <input 
                      type="text" 
                      value={ac} 
                      onChange={(e) => setAc(e.target.value)}
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
                      Femur Length (FL) (mm):
                    </label>
                    <input 
                      type="text" 
                      value={fl} 
                      onChange={(e) => setFl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Nuchal Cord Section */}
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
                Nuchal Cord Assessment
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#000000',
                  fontWeight: '500',
                }}>
                  Nuchal Cord:
                </label>
                <select 
                  value={nuchalCord} 
                  onChange={(e) => setNuchalCord(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Nuchal Cord Status</option>
                  <option value="No Nuchal Cord">No cord seen around the fetal neck</option>
                  <option value="x1">A single loop of cord is seen around the fetal neck.</option>
                  <option value="x2">A double loop of cord is seen around the fetal neck.</option>
                </select>
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
                value={abnormalities}
                onChange={(e) => setAbnormalities(e.target.value)}
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
            {editableReport ? (
              <textarea
                value={editableReport}
                onChange={(e) => setEditableReport(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'Arial, sans-serif',
                  resize: 'vertical',
                }}
              />
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
            You can edit the report above before submitting. Report generator can make mistakes, please verify all information.
          </div>

          {editableReport && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
            }}>
              <button 
                onClick={handleSubmitReport}
                disabled={isSubmitting || printLoading}
                style={{
                  backgroundColor: '#000000',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.3s',
                  ':hover': {
                    backgroundColor: '#333333',
                  },
                  opacity: (isSubmitting || printLoading) ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
             
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    onClose();
                  }
                }}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
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
          )}
        </div>
      </div>
    </div>
  );
}

export default ThirdTrimesterModal;