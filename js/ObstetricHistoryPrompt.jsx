import React, { useState, useEffect } from 'react';
import { urls } from './config.dev'; // Import the backend URLs
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ObstetricHistoryPrompt = (props) => {
  const { 
    first_name, 
    last_name, 
    maternity_id, 
    onClose, 
    clinicInfo,
    clinicName,
    district,
    town,
    ownersContact,
    age,
    address,
    phone_number
  } = props;
  
  const [isLoading, setIsLoading] = useState(false);
  
  // State to store form data
  const [formData, setFormData] = useState(
    Array.from({ length: 10 }, () => ({
      pregnancy: '',
      year: '',
      below12Weeks: false,
      above12Weeks: false,
      premature: false,
      fullTerm: false,
      thirdStage: false,
      purePerium: false,
      aliveSB_NND: '',
      sex: '',
      birthWeight: '',
      immun: false,
      healthConditions: '',
    }))
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get clinic info from props (with fallbacks)
  const clinicData = {
    clinicName: clinicInfo?.clinicName || clinicName || props.clinicName || '',
    district: clinicInfo?.district || district || props.district || '',
    town: clinicInfo?.town || town || props.town || '',
    ownersContact: clinicInfo?.ownersContact || ownersContact || props.ownersContact || '',
  };

  // Patient info
  const patientInfo = {
    name: `${first_name || ''} ${last_name || ''}`.trim(),
    age: age || props.age || '',
    address: address || props.address || '',
    phone: phone_number || props.phone_number || '',
    maternity_id: maternity_id || props.maternity_id || '',
  };

  // Fetch obstetric history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(urls.FetchObsHistory, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maternity_id: patientInfo.maternity_id }),
        });
        const data = await response.json();

        if (response.ok && data.data && data.data.length > 0) {
          const filledData = [
            ...data.data.map((item) => ({
              pregnancy: item.pregnancy_number || '',
              year: item.year || '',
              below12Weeks: item.below12Weeks || false,
              above12Weeks: item.above12Weeks || false,
              premature: item.premature || false,
              fullTerm: item.fullTerm || false,
              thirdStage: item.thirdStage || false,
              purePerium: item.purePerium || false,
              aliveSB_NND: item.aliveSB_NND || '',
              sex: item.sex || '',
              birthWeight: item.birthWeight || '',
              immun: item.immun || false,
              healthConditions: item.healthConditions || '',
            })),
            ...Array.from({ length: 10 - data.data.length }, () => ({
              pregnancy: '',
              year: '',
              below12Weeks: false,
              above12Weeks: false,
              premature: false,
              fullTerm: false,
              thirdStage: false,
              purePerium: false,
              aliveSB_NND: '',
              sex: '',
              birthWeight: '',
              immun: false,
              healthConditions: '',
            })),
          ];
          setFormData(filledData);
        } else {
          setFormData(
            Array.from({ length: 10 }, () => ({
              pregnancy: '',
              year: '',
              below12Weeks: false,
              above12Weeks: false,
              premature: false,
              fullTerm: false,
              thirdStage: false,
              purePerium: false,
              aliveSB_NND: '',
              sex: '',
              birthWeight: '',
              immun: false,
              healthConditions: '',
            }))
          );
        }
      } catch (err) {
        setError('Failed to fetch obstetric history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientInfo.maternity_id]);

  const handleChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const newFormData = [...formData];
    if (type === 'checkbox') {
      newFormData[index][name] = checked;
    } else {
      newFormData[index][name] = value;
    }
    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const filteredData = formData.filter((row) => {
        const hasAnyValue = Object.values(row).some((value) => value !== '' && value !== false);
        return hasAnyValue;
      });
  
      const invalidRows = filteredData.filter((row) => !row.pregnancy || !row.year);
      if (invalidRows.length > 0) {
        toast.error('All rows must include a Pregnancy and Year value.', {
          position: 'top-right',
        });
        setIsLoading(false);
        return;
      }
  
      const payload = filteredData.map((row) => ({
        pregnancy: row.pregnancy || '',
        year: row.year || '',
        below12Weeks: row.below12Weeks || false,
        above12Weeks: row.above12Weeks || false,
        premature: row.premature || false,
        fullTerm: row.fullTerm || false,
        thirdStage: row.thirdStage || false,
        purePerium: row.purePerium || false,
        aliveSB_NND: row.aliveSB_NND || '',
        sex: row.sex || '',
        birthWeight: row.birthWeight || '',
        immun: row.immun || false,
        healthConditions: row.healthConditions || '',
      }));
  
      const response = await fetch(urls.updateobshistory, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maternity_id: patientInfo.maternity_id, formData: payload }),
      });
  
      if (response.ok) {
        toast.success('Obstetric History updated successfully!', {
          position: 'top-right',
        });
      } else {
        toast.error('Failed to update Obstetric History.', {
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error updating obstetric history:', error);
      toast.error('An error occurred while updating obstetric history.', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── PRINT HANDLER - A4 LANDSCAPE FORMAT ─────────────────────────────────
  const handlePrint = () => {
    const boolLabel = (val) => (val ? '✓' : '✗');
    
    // Filter out empty rows for printing
    const nonEmptyRows = formData.filter(row => row.pregnancy || row.year || row.healthConditions);
    
    const tableRows = nonEmptyRows.map((row, idx) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center;">${row.pregnancy || '—'}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center;">${row.year || '—'}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.below12Weeks ? '#1a6e3c' : '#999'};">${boolLabel(row.below12Weeks)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.above12Weeks ? '#1a6e3c' : '#999'};">${boolLabel(row.above12Weeks)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.premature ? '#1a6e3c' : '#999'};">${boolLabel(row.premature)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.fullTerm ? '#1a6e3c' : '#999'};">${boolLabel(row.fullTerm)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.thirdStage ? '#1a6e3c' : '#999'};">${boolLabel(row.thirdStage)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.purePerium ? '#1a6e3c' : '#999'};">${boolLabel(row.purePerium)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center;">${row.aliveSB_NND || '—'}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center;">${row.sex || '—'}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center;">${row.birthWeight || '—'}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px; text-align: center; color: ${row.immun ? '#1a6e3c' : '#999'};">${boolLabel(row.immun)}</td>
        <td style="padding: 6px 4px; border: 1px solid #ccc; font-size: 9px;">${row.healthConditions || '—'}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Obstetric History – ${patientInfo.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }

          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }

          body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.3;
          }

          .page-header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #1a1a2e;
            padding-bottom: 8px;
          }
          
          .page-header h1 {
            font-size: 16px;
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
            font-size: 9px;
            color: #555;
            margin-top: 4px;
            padding: 0 8px;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .clinic-header div {
            background: #f5f5f5;
            padding: 4px 12px;
            border-radius: 4px;
          }
          
          .clinic-header span {
            font-weight: 600;
            color: #1a1a2e;
          }
          
          .patient-info {
            background: #f0f7ff;
            padding: 8px 12px;
            border-radius: 6px;
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 9px;
          }
          
          .patient-info span {
            font-weight: 600;
            color: #0066cc;
          }

          .report-title {
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            margin: 12px 0 8px;
            color: #0066cc;
            text-transform: uppercase;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 9px;
          }

          th {
            border: 1px solid #333;
            padding: 8px 4px;
            text-align: center;
            background-color: #e8e8e8;
            font-weight: 700;
            font-size: 9px;
          }

          td {
            border: 1px solid #ccc;
            padding: 6px 4px;
            vertical-align: top;
          }

          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
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
            .patient-info {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <h1>OBSTETRIC HISTORY RECORD</h1>
          <div class="clinic-header">
            <div>🏥 <span>${clinicData.clinicName || 'Clinic'}</span></div>
            <div>📞 <span>${clinicData.ownersContact || 'N/A'}</span></div>
            <div>📍 <span>${clinicData.district || ''} | ${clinicData.town || ''}</span></div>
          </div>
        </div>
        
        <div class="patient-info">
          <div><span>Patient Name:</span> ${patientInfo.name}</div>
          <div><span>Maternity ID:</span> ${patientInfo.maternity_id}</div>
          <div><span>Age:</span> ${patientInfo.age || 'N/A'}</div>
          <div><span>Address:</span> ${patientInfo.address || 'N/A'}</div>
          <div><span>Phone:</span> ${patientInfo.phone || 'N/A'}</div>
        </div>
        
        <div class="report-title">Obstetric History Details</div>
        
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align: middle;">Preg #</th>
              <th rowspan="2" style="vertical-align: middle;">Year</th>
              <th colspan="2">Abortions</th>
              <th colspan="4">Types of Deliveries</th>
              <th colspan="5">Child Information</th>
            </tr>
            <tr>
              <th>Below 12 wks</th>
              <th>Above 12 wks</th>
              <th>Pre-Mature</th>
              <th>Full Term</th>
              <th>3rd Stage</th>
              <th>Pure Perium</th>
              <th>Alive/SB/NND</th>
              <th>Sex</th>
              <th>Birth Wt (kg)</th>
              <th>Immun.</th>
              <th>Health Conditions</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="13" style="text-align: center;">No obstetric history records found</td></tr>'}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Printed on: ${new Date().toLocaleString()} | Obstetric History Report</p>
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

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading obstetric history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={overlayStyle}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <h2 style={headingStyle}>
          Obstetric History for {patientInfo.name}
        </h2>
        
        {/* Display Clinic Info Banner */}
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
        
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th rowSpan="2" style={headerStyle}>Pregnancy</th>
                <th rowSpan="2" style={headerStyle}>Year</th>
                <th colSpan="2" style={headerStyle}>Abortions</th>
                <th colSpan="4" style={headerStyle}>Types of Deliveries</th>
                <th colSpan="5" style={headerStyle}>Child</th>
              </tr>
              <tr>
                <th style={headerStyle}>Below 12 Weeks</th>
                <th style={headerStyle}>Above 12 Weeks</th>
                <th style={headerStyle}>Pre-Mature</th>
                <th style={headerStyle}>Full Term</th>
                <th style={headerStyle}>Third Stage</th>
                <th style={headerStyle}>Pure Perium</th>
                <th style={headerStyle}>Alive SB/NND</th>
                <th style={headerStyle}>Sex</th>
                <th style={headerStyle}>Birth Weight</th>
                <th style={headerStyle}>Immun.</th>
                <th style={headerStyle}>Health Conditions</th>
              </tr>
            </thead>
            <tbody>
              {formData.map((data, index) => (
                <tr key={index}>
                  <td style={cellStyle}>
                    <input type="text" name="pregnancy" value={data.pregnancy} onChange={(e) => handleChange(index, e)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" name="year" value={data.year} onChange={(e) => handleChange(index, e)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="below12Weeks" checked={data.below12Weeks} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="above12Weeks" checked={data.above12Weeks} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="premature" checked={data.premature} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="fullTerm" checked={data.fullTerm} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="thirdStage" checked={data.thirdStage} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="purePerium" checked={data.purePerium} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" name="aliveSB_NND" value={data.aliveSB_NND} onChange={(e) => handleChange(index, e)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" name="sex" value={data.sex} onChange={(e) => handleChange(index, e)} style={inputStyle} placeholder="M/F" />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" name="birthWeight" value={data.birthWeight} onChange={(e) => handleChange(index, e)} style={inputStyle} />
                  </td>
                  <td style={cellStyle}>
                    <input type="checkbox" name="immun" checked={data.immun} onChange={(e) => handleChange(index, e)} />
                  </td>
                  <td style={cellStyle}>
                    <input type="text" name="healthConditions" value={data.healthConditions} onChange={(e) => handleChange(index, e)} style={inputStyle} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={buttonContainerStyle}>
          <button
            onClick={handleSubmit}
            style={buttonStyle}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>
                <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '5px' }} />
                Submitting...
              </span>
            ) : (
              'Submit'
            )}
          </button>
          
          <button onClick={handlePrint} style={{
            ...buttonStyle,
            backgroundColor: '#007bff',
            marginLeft: '10px'
          }}>
            🖨 Print
          </button>
          
          <button onClick={onClose} style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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
  zIndex: '1000',
};

const containerStyle = {
  position: 'relative',
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  width: '95vw',
  maxWidth: '1400px',
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

const headingStyle = {
  textAlign: 'center',
  fontSize: '18px',
  marginBottom: '12px',
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
  minWidth: '1200px',
};

const headerStyle = {
  border: '1px solid #333',
  padding: '6px 4px',
  textAlign: 'center',
  backgroundColor: '#e8e8e8',
  fontWeight: 'bold',
  fontSize: '11px',
};

const cellStyle = {
  border: '1px solid #ccc',
  padding: '4px',
  textAlign: 'center',
};

const inputStyle = {
  width: '100%',
  fontSize: '11px',
  padding: '4px',
  border: '1px solid #ddd',
  borderRadius: '3px',
};

const buttonContainerStyle = {
  marginTop: '16px',
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap',
};

const buttonStyle = {
  fontSize: '13px',
  padding: '10px 24px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
};

export default ObstetricHistoryPrompt;