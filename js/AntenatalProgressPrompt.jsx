import React, { useEffect, useState } from 'react';
import { urls } from './config.dev';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AntenatalProgressPrompt = ({
  first_name,
  last_name,
  age,
  address,
  phone_number,
  clinicName,
  employeeName,
  maternity_id,
  status,
  tokenFromUrl,
  onClose,
  clinicInfo,
  district,
  town,
  ownersContact
}) => {
  const [tableData, setTableData] = useState([...Array(10)].map(() => Array(17).fill('')));
  const [loading, setLoading] = useState(false);

  const [investigations, setInvestigations] = useState({
    bloodHb: '',
    rprVdrl: '',
    mp: '',
    hiv: '',
    others: '',
    xRay: ''
  });
  const [pelvicAssessment, setPelvicAssessment] = useState({
    diagonalConjugate: '',
    sacralCurve: '',
    ischialSpines: '',
    subpubicArch: '',
    ischialTuberosities: '',
    pelvisAssessment: ''
  });
  const [ultrasoundReports, setUltrasoundReports] = useState('');
  const [riskFactors, setRiskFactors] = useState('');
  const [treatment, setTreatment] = useState('');

  // Get clinic info from props
  const clinicData = {
    clinicName: clinicInfo?.clinicName || clinicName || '',
    district: clinicInfo?.district || district || '',
    town: clinicInfo?.town || town || '',
    ownersContact: clinicInfo?.ownersContact || ownersContact || '',
  };

  // Patient info
  const patientInfo = {
    name: `${first_name || ''} ${last_name || ''}`.trim(),
    age: age || '',
    address: address || '',
    phone: phone_number || '',
    maternity_id: maternity_id || '',
  };

  const tableHeaders = [
    'Date', 'Weeks of Amenorrhoea', 'Fundal Height', 'Presentation', 'Position /He',
    'Relation PP/Brim', 'Foetal Heart', 'Weight', 'HP', 'Varience/Oedema', 'Urine',
    'TT', 'IPT', 'Net Use', 'Complaints and Remarks', 'Return Date', 'Name of Examiner'
  ];

  const handleInputChange = (rowIndex, colIndex, value) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][colIndex] = value;
    setTableData(updatedData);
  };

  const handleInvestigationChange = (field, value) => {
    setInvestigations(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const handlePelvicAssessmentChange = (assessment, value) => {
    setPelvicAssessment(prevState => ({
      ...prevState,
      [assessment]: value
    }));
  };

  const handleTextAreaChange = (setter) => (event) => {
    setter(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const antenatalResponse = await fetch(
          `${urls.fetchAntenatalData}?maternity_id=${maternity_id}&token=${tokenFromUrl}`
        );
        const antenatalResult = await antenatalResponse.json();
        if (antenatalResult.success) {
          const data = antenatalResult.data || [];
          const rowsNeeded = Math.max(10 - data.length, 0);
          const emptyRows = [...Array(rowsNeeded)].map(() => Array(17).fill(''));
          setTableData([...data, ...emptyRows]);
        } else {
          setTableData([...Array(10)].map(() => Array(17).fill('')));
        }

        const investigationsResponse = await fetch(
          `${urls.fetchMaternityInvestigations}?maternity_id=${maternity_id}&token=${tokenFromUrl}`
        );
        const investigationsResult = await investigationsResponse.json();
        if (investigationsResult.success) {
          const fetchedInvestigations = investigationsResult.data.investigations || {};
          setInvestigations((prevState) => ({
            ...prevState,
            ...fetchedInvestigations,
          }));
        }

        const pelvicAssessmentResponse = await fetch(
          `${urls.fetchMaternityPelvis}?maternity_id=${maternity_id}&token=${tokenFromUrl}`
        );
        const pelvicAssessmentResult = await pelvicAssessmentResponse.json();
        if (pelvicAssessmentResult.success) {
          setPelvicAssessment(pelvicAssessmentResult.data.pelvicAssessment || {});
          setUltrasoundReports(pelvicAssessmentResult.data.ultrasoundReports || '');
          setRiskFactors(pelvicAssessmentResult.data.riskFactors || '');
          setTreatment(pelvicAssessmentResult.data.treatment || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setTableData([...Array(10)].map(() => Array(17).fill('')));
        setInvestigations({});
        setPelvicAssessment({});
        setUltrasoundReports('');
        setRiskFactors('');
        setTreatment('');
      }
    };

    fetchData();
  }, [maternity_id, tokenFromUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const filteredAntenatalData = tableData.filter(row => row.some(cell => cell !== ""));

    const antenatalDataPayload = {
      maternity_id,
      employeeName,
      clinicName: clinicData.clinicName,
      antenatalData: filteredAntenatalData,
      token: tokenFromUrl,
    };

    const investigationsPayload = {
      maternity_id,
      investigations,
      token: tokenFromUrl,
    };

    const pelvicAssessmentPayload = {
      maternity_id,
      pelvicAssessment,
      riskFactors,
      treatment,
      ultrasoundReports,
      token: tokenFromUrl,
    };

    try {
      const antenatalResponse = await fetch(urls.submitAntenatalData, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(antenatalDataPayload),
      });
      const antenatalResult = await antenatalResponse.json();

      const investigationsResponse = await fetch(urls.submitMaternityInvestigations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investigationsPayload),
      });
      const investigationsResult = await investigationsResponse.json();

      const pelvicAssessmentResponse = await fetch(urls.submitMaternityPelvis, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pelvicAssessmentPayload),
      });
      const pelvicAssessmentResult = await pelvicAssessmentResponse.json();

      if (
        antenatalResult.success &&
        investigationsResult.success &&
        pelvicAssessmentResult.success
      ) {
        const ancPointsPayload = {
          maternity_id,
          token: tokenFromUrl,
        };

        const ancPointsResponse = await fetch(urls.ANCpoints2, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ancPointsPayload),
        });
        const ancPointsResult = await ancPointsResponse.json();

        console.log('ANC points response:', ancPointsResult);
        toast.success('Data submitted successfully');
      } else {
        toast.error('Error submitting data');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error submitting data');
    } finally {
      setLoading(false);
    }
  };

  // ─── PRINT HANDLER - A4 LANDSCAPE FORMAT ─────────────────────────────────
  const handlePrint = () => {
    // Filter out empty rows for printing
    const nonEmptyRows = tableData.filter(row => row.some(cell => cell && cell.trim() !== ''));

    const tableRows = nonEmptyRows.map((row, idx) => `
      <tr style="border-bottom: 1px solid #ddd;">
        ${row.map((cell, colIdx) => `
          <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 8px; vertical-align: top;">
            ${cell || '—'}
          </td>
        `).join('')}
      </tr>
    `).join('');

    // Helper to format section titles
    const formatLabel = (str) => str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Antenatal Progress – ${patientInfo.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }

          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }

          body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 9px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.25;
          }

          .page-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #1a1a2e;
            padding-bottom: 6px;
          }
          
          .page-header h1 {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
            color: #1a1a2e;
          }
          
          .clinic-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            color: #555;
            margin-top: 4px;
            padding: 0 8px;
            flex-wrap: wrap;
            gap: 6px;
          }
          
          .clinic-header div {
            background: #f5f5f5;
            padding: 3px 10px;
            border-radius: 4px;
          }
          
          .clinic-header span {
            font-weight: 600;
            color: #1a1a2e;
          }
          
          .patient-info {
            background: #f0f7ff;
            padding: 6px 10px;
            border-radius: 6px;
            margin: 6px 0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 8px;
          }
          
          .patient-info span {
            font-weight: 600;
            color: #0066cc;
          }

          .section-title {
            font-size: 11px;
            font-weight: bold;
            margin: 12px 0 6px;
            color: #0066cc;
            border-left: 3px solid #0066cc;
            padding-left: 8px;
            text-transform: uppercase;
          }

          .sub-section-title {
            font-size: 10px;
            font-weight: 600;
            margin: 8px 0 4px;
            color: #1a1a2e;
            background: #e8e8e8;
            padding: 4px 8px;
            border-radius: 4px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 7px;
          }

          th {
            border: 1px solid #333;
            padding: 5px 3px;
            text-align: center;
            background-color: #e8e8e8;
            font-weight: 700;
            font-size: 7px;
            white-space: nowrap;
          }

          td {
            border: 1px solid #ccc;
            padding: 4px 3px;
            vertical-align: top;
          }

          .info-block {
            margin: 8px 0;
            padding: 6px;
            background: #fafafa;
            border-left: 3px solid #4CAF50;
          }

          .info-block p {
            margin: 4px 0;
            font-size: 8px;
          }

          .info-label {
            font-weight: 600;
            color: #333;
            min-width: 120px;
            display: inline-block;
          }

          .footer {
            margin-top: 16px;
            text-align: center;
            font-size: 7px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 6px;
          }

          .print-btn {
            display: block;
            margin: 12px auto 0;
            padding: 6px 24px;
            background: #1a1a2e;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
          }

          @media print {
            .print-btn { display: none !important; }
            body { 
              width: 100%;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .patient-info, th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <h1>ANTENATAL PROGRESS EXAMINATION</h1>
          <div class="clinic-header">
            <div>🏥 <span>${clinicData.clinicName || 'Clinic'}</span></div>
            <div>📞 <span>${clinicData.ownersContact || 'N/A'}</span></div>
            <div>📍 <span>${clinicData.district || ''} | ${clinicData.town || ''}</span></div>
          </div>
        </div>
        
        <div class="patient-info">
          <div><span>Patient:</span> ${patientInfo.name}</div>
          <div><span>Maternity ID:</span> ${patientInfo.maternity_id}</div>
          <div><span>Age:</span> ${patientInfo.age || 'N/A'}</div>
          <div><span>Address:</span> ${patientInfo.address || 'N/A'}</div>
          <div><span>Phone:</span> ${patientInfo.phone || 'N/A'}</div>
          <div><span>Examiner:</span> ${employeeName || 'N/A'}</div>
        </div>
        
        ${nonEmptyRows.length > 0 ? `
          <div class="section-title">Progress Examination Records</div>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  ${tableHeaders.map(header => `<th style="white-space: nowrap;">${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        ` : '<p style="text-align: center; color: #999;">No progress examination records found.</p>'}
        
        <div class="section-title">Investigations</div>
        <div class="info-block">
          ${Object.entries(investigations).filter(([_, val]) => val && val.trim()).length > 0 ? `
            ${Object.entries(investigations).map(([key, val]) => val && val.trim() ? `
              <p><span class="info-label">${formatLabel(key)}:</span> ${val}</p>
            ` : '').join('')}
          ` : '<p>No investigation records found.</p>'}
          <p style="font-size: 7px; color: #999; margin-top: 6px;"><em>Note: For lab/ultrasound requests, please go to triage.</em></p>
        </div>
        
        <div class="section-title">Pelvic Assessment (36 weeks)</div>
        <div class="info-block">
          ${Object.entries(pelvicAssessment).filter(([_, val]) => val && val.trim()).length > 0 ? `
            ${Object.entries(pelvicAssessment).map(([key, val]) => val && val.trim() ? `
              <p><span class="info-label">${formatLabel(key)}:</span> ${val}</p>
            ` : '').join('')}
          ` : '<p>No pelvic assessment records found.</p>'}
        </div>
        
        ${ultrasoundReports ? `
          <div class="section-title">Ultrasound Reports & Dates</div>
          <div class="info-block">
            <p>${ultrasoundReports}</p>
          </div>
        ` : ''}
        
        ${riskFactors ? `
          <div class="section-title">Risk Factors</div>
          <div class="info-block">
            <p>${riskFactors}</p>
          </div>
        ` : ''}
        
        ${treatment ? `
          <div class="section-title">Treatment Given</div>
          <div class="info-block">
            <p>${treatment}</p>
            <p style="font-size: 7px; color: #999; margin-top: 6px;"><em>Note: For medication dispensing, use "Non Sale Stock Removal" in the dispensing section.</em></p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Printed on: ${new Date().toLocaleString()} | Antenatal Progress Report | Examiner: ${employeeName || 'N/A'}</p>
        </div>
        
        <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 100);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };
  // ─── END PRINT HANDLER ───────────────────────────────────────────────────

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const containerStyle = {
    position: 'relative',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    width: '95vw',
    maxWidth: '1500px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };

  const headingStyle = {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '12px',
    fontWeight: 'bold',
    color: '#0066cc',
  };

  const tableContainerStyle = {
    width: '100%',
    overflowX: 'auto',
    flex: 1,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    minWidth: '1400px',
  };

  const headerStyle = {
    border: '1px solid #ccc',
    padding: '6px',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: '10px',
    whiteSpace: 'nowrap',
  };

  const cellStyle = {
    border: '1px solid #ccc',
    padding: '4px',
    textAlign: 'center',
  };

  const inputStyle = {
    width: '100%',
    fontSize: '10px',
    padding: '4px',
    boxSizing: 'border-box',
    border: '1px solid #ddd',
    borderRadius: '3px',
  };

  const commentsSectionStyle = {
    marginTop: '16px',
  };

  const textAreaStyle = {
    width: '100%',
    height: '70px',
    marginTop: '5px',
    fontSize: '11px',
    padding: '6px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const buttonContainerStyle = {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  };

  const buttonStyle = {
    fontSize: '13px',
    padding: '10px 24px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  };

  const printButtonStyle = {
    fontSize: '13px',
    padding: '10px 24px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  };

  const closeButtonStyle = {
    fontSize: '13px',
    padding: '10px 24px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <h2 style={headingStyle}>Antenatal Progress Examination - {patientInfo.name}</h2>
        
        {/* Clinic Info Banner */}
        <div style={{
          backgroundColor: '#0066cc',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          textAlign: 'center',
          fontSize: '11px'
        }}>
          <span>🏥 {clinicData.clinicName || 'LIFESURE MEDICARE'}</span>
          <span style={{ marginLeft: '16px' }}>📞 {clinicData.ownersContact || 'N/A'}</span>
          <span style={{ marginLeft: '16px' }}>📍 {clinicData.district || ''} | {clinicData.town || ''}</span>
        </div>
        
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "5px 10px",
            backgroundColor: "transparent",
            color: "#dc3545",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          &times;
        </button>
        
        <form onSubmit={handleSubmit}>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th key={index} style={headerStyle}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} style={cellStyle}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={commentsSectionStyle}>
            <h3 style={{ color: '#0066cc', marginBottom: '8px' }}>Investigations</h3>
            <div style={{ marginTop: '5px', fontStyle: 'italic', fontSize: '10px', color: 'red' }}>
              <p><strong>NB:</strong> To request lab or ultrasound investigations, please go to triage.</p>
            </div>
            {['bloodHb', 'rprVdrl', 'mp', 'hiv', 'others', 'xRay'].map((investigation, index) => (
              <div key={index}>
                <h4 style={{ textTransform: 'capitalize', fontSize: '12px', marginTop: '8px' }}>
                  {investigation.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <textarea
                  style={textAreaStyle}
                  placeholder={`Enter details for ${investigation.replace(/([A-Z])/g, ' $1').trim()}...`}
                  value={investigations[investigation]}
                  onChange={(e) => handleInvestigationChange(investigation, e.target.value)}
                  rows="2"
                />
              </div>
            ))}

            <h3 style={{ color: '#0066cc', margin: '16px 0 8px' }}>Pelvic Assessment - Done at 36 weeks</h3>
            {['diagonalConjugate', 'sacralCurve', 'ischialSpines', 'subpubicArch', 'ischialTuberosities', 'pelvisAssessment'].map((assessment, index) => (
              <div key={index}>
                <h4 style={{ fontSize: '12px', marginTop: '8px' }}>{assessment.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <textarea
                  style={textAreaStyle}
                  placeholder={`Enter details for ${assessment.replace(/([A-Z])/g, ' $1').trim()}...`}
                  value={pelvicAssessment[assessment]}
                  onChange={(e) => handlePelvicAssessmentChange(assessment, e.target.value)}
                  rows="2"
                />
              </div>
            ))}

            <div>
              <h3 style={{ color: '#0066cc', margin: '16px 0 8px' }}>Ultra Sound Reports & Dates:</h3>
              <textarea
                style={textAreaStyle}
                rows="2"
                value={ultrasoundReports}
                onChange={handleTextAreaChange(setUltrasoundReports)}
              />
              
              <h3 style={{ color: '#0066cc', margin: '16px 0 8px' }}>Risk Factors:</h3>
              <textarea
                style={textAreaStyle}
                rows="2"
                value={riskFactors}
                onChange={handleTextAreaChange(setRiskFactors)}
              />
              
              <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '10px', color: 'red' }}>
                <p><strong>NB:</strong> For any treatment given, go to dispensing shelves → "Non Sale Stock Removal" to record dispensed drugs.</p>
              </div>
              
              <h3 style={{ color: '#0066cc', margin: '16px 0 8px' }}>Treatment:</h3>
              <textarea
                style={textAreaStyle}
                rows="2"
                value={treatment}
                onChange={handleTextAreaChange(setTreatment)}
              />
            </div>
          </div>

          <div style={buttonContainerStyle}>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
              ) : (
                "💾 Submit"
              )}
            </button>
            <button type="button" style={printButtonStyle} onClick={handlePrint}>
              🖨 Print
            </button>
            <button type="button" style={closeButtonStyle} onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AntenatalProgressPrompt;