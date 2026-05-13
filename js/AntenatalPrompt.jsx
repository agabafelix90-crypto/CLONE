import React, { useEffect, useState, useRef } from 'react';
import { urls } from './config.dev';
import './AntenatalPrompt.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ObstetricHistoryPrompt from './ObstetricHistoryPrompt';
import AntenatalProgressPrompt from './AntenatalProgressPrompt';
import PartogramPrompt from './PartogramPrompt';

const AntenatalPrompt = (props) => {
  console.log('All props data in AntenatalPrompt:', props);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Extract clinic information from props (from the security URL response)
  const clinicInfo = {
    clinicName: props.clinicName || '',
    district: props.district || '',
    town: props.town || '',
    ownersContact: props.ownersContact || '',
  };

  const [formData, setFormData] = useState({
    name: `${props.first_name} ${props.last_name}`,
    age: props.age || '',
    address: props.address || '',
    phoneNumber: props.phone_number || '',
    clinicName: props.clinicName || '',
    religion: '',
    medicalHistory: {
      rheumaticFever: false,
      cardiacDisease: false,
      kidneyDisease: false,
      hypertension: false,
      tuberculosis: false,
      asthma: false,
      sexuallyTransmittedDiseases: false,
      sickleCellDisease: false,
      epilepsy: false,
      diabetes: false,
    },
    pelvicExam: { vulva: '', vagina: '', cervix: '', moniliasis: '' },
    familyHistory: {
      diabetes: false,
      hypertension: false,
      sickleCellDisease: false,
      epilepsy: false,
      twins: false,
    },
    obgynHistory: {
      ectopicPregnancy: false,
      dAndC: false,
      cesareanSection: false,
      vacuumExtraction: false,
      forcepsExtraction: false,
      retainedPlacenta: false,
      pph: false,
    },
    surgicalHistory: {
      operations: false,
      bloodTransfusion: false,
      skeletalDeformity: false,
      pelvisFemurFeatures: false,
    },
    socialHistory: { smoking: '', alcohol: '', healthOfHusband: '' },
    presentPregnancy: {
      firstDayOfLNMP: '',
      EDD: '',
      periodOfGestation: '',
      hospitalizationDetails: '',
      bleeding: '',
      vomiting: '',
      feversCoughFluWeightLoss: '',
    },
    menstrualHistory: {
      cycleLength: '',
      amountOfFlow: '',
      familyPlanningUsed: '',
      neverUsedFamilyPlanningReason: '',
    },
    physicalExam: {
      height: '',
      temperature: '',
      weight: '',
      pulse: '',
      oralThrush: '',
      teeth: '',
      neck: '',
      breasts: '',
      legs: '',
      deformities: '',
      lymphGlands: '',
      herpesZoster: '',
      nutritionalStatus: '',
      anaemia: '',
      eyes: '',
      mucousMembranes: '',
      nails: '',
      palms: '',
      heart: '',
      lungs: '',
    },
    otherPersonalDetails: {
      occupation: '',
      education: '',
      tribe: '',
      maritalStatus: '',
      nextOfKin: '',
      relationshipWithNextOfKin: '',
      nextOfKinOccupation: '',
      nextOfKinPhone: '',
      deliveryLocation: '',
      postDeliveryLocation: '',
      gravida: '',
      para: '',
      abortions: '',
      bloodGroup: '',
      rhesus: '',
    },
  });

  useEffect(() => {
    const fetchAntenatalDetails = async () => {
      try {
        const response = await fetch(urls.AntenatalDetails, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maternity_id: props.maternity_id }),
        });
        if (response.ok) {
          const data = await response.json();
          if (!(data.message && data.message === 'No data found for the provided Maternity ID')) {
            setFormData((prevData) => ({
              ...prevData,
              medicalHistory: { ...prevData.medicalHistory, ...data.medicalHistory },
              pelvicExam: { ...prevData.pelvicExam, ...data.pelvicExam },
              familyHistory: {
                ...prevData.familyHistory,
                ...data.familyHistory,
                twins: data.familyHistory.twins === 1,
              },
              obgynHistory: { ...prevData.obgynHistory, ...data.obgynHistory },
              surgicalHistory: { ...prevData.surgicalHistory, ...data.surgicalHistory },
              socialHistory: { ...prevData.socialHistory, ...data.socialHistory },
              presentPregnancy: { ...prevData.presentPregnancy, ...data.presentPregnancy },
              menstrualHistory: { ...prevData.menstrualHistory, ...data.menstrualHistory },
              physicalExam: { ...prevData.physicalExam, ...data.physicalExam },
              otherPersonalDetails: { ...prevData.otherPersonalDetails, ...data.otherPersonalDetails },
            }));
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching antenatal details:', error);
        setLoading(false);
      }
    };
    fetchAntenatalDetails();
  }, [props.maternity_id]);

  // Prepare the details object to be passed to child prompts
  const ANCdetails = {
    first_name: props.first_name,
    last_name: props.last_name,
    age: props.age,
    address: props.address,
    phone_number: props.phone_number,
    clinicName: props.clinicName,
    employeeName: props.employeeName,
    maternity_id: props.maternity_id,
    status: props.status,
    style: props.style,
    tokenFromUrl: props.tokenFromUrl,
    clinicInfo: clinicInfo,
    district: props.district,
    town: props.town,
    ownersContact: props.ownersContact,
  };

  const handleChange = (section, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [section]: { ...prevData[section], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    try {
      const mainPayload = {
        familyHistory: formData.familyHistory,
        medicalHistory: formData.medicalHistory,
        menstrualHistory: formData.menstrualHistory,
        obgynHistory: formData.obgynHistory,
        otherPersonalDetails: formData.otherPersonalDetails,
        pelvicExam: formData.pelvicExam,
        physicalExam: formData.physicalExam,
        presentPregnancy: formData.presentPregnancy,
        surgicalHistory: formData.surgicalHistory,
        maternity_id: props.maternity_id,
        token: props.tokenFromUrl,
      };
      const mainResponse = await fetch(urls.submitantenataldetails, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mainPayload),
      });
      if (!mainResponse.ok) { toast.error('Failed to submit antenatal details.'); return; }

      const socialHistoryResponse = await fetch(urls.updateSocialHistory, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialHistory: formData.socialHistory,
          maternity_id: props.maternity_id,
          token: props.tokenFromUrl,
        }),
      });
      if (!socialHistoryResponse.ok) { toast.error('Failed to submit social history.'); return; }

      const ancPointsData = await (await fetch(urls.ANCpoints1, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: props.tokenFromUrl, maternity_id: props.maternity_id }),
      })).json();
      console.log('Response from ANCpoints1:', ancPointsData);
      toast.success('Antenatal details updated successfully!');
    } catch (error) {
      toast.error('Error submitting antenatal details.');
      console.error('Error submitting antenatal details:', error);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => { handleSubmit(); }, 100000);
    return () => clearInterval(intervalRef.current);
  }, [formData, props.maternity_id, props.tokenFromUrl]);

  const handleClose = () => { if (props.onClose) props.onClose(); };
  
  const handleCardClick = (e) => {
    e.stopPropagation();
  };

  const [activePrompt, setActivePrompt] = useState(null);
  const handleButtonClick = (promptType) => setActivePrompt(promptType);
  const handleClosePrompt = () => setActivePrompt(null);

  // ─── IMPROVED PRINT HANDLER - INCREASED FONT SIZES ─────────────
  const handlePrint = () => {
    const boolLabel = (val) => (val ? '✓' : '✗');
    const camel = (str) => str.replace(/([A-Z])/g, ' $1').trim();

    const checkRows = (obj) =>
      Object.entries(obj)
        .map(
          ([k, v]) => `
            <tr>
              <td style="padding:2px 6px;color:#555;font-size:10px;">${camel(k)}</td>
              <td style="padding:2px 6px;font-weight:600;font-size:10px;color:${v ? '#1a6e3c' : '#999'};">${boolLabel(v)}</td>
            </tr>`
        )
        .join('');

    const fieldRow = (label, value) =>
      `<div style="margin-bottom:3px;">
        <span style="font-size:8.5px;color:#888;display:block;text-transform:uppercase;letter-spacing:.3px;">${label}</span>
        <span style="font-size:10px;color:#222;">${value || '—'}</span>
      </div>`;

    const sectionTitle = (title) =>
      `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1a1a2e;border-bottom:1px solid #1a1a2e;padding-bottom:2px;margin:8px 0 4px;">${title}</div>`;

    const { otherPersonalDetails: opd, menstrualHistory: mh, presentPregnancy: pp,
            physicalExam: pe, pelvicExam: pelv, medicalHistory, obgynHistory,
            surgicalHistory, socialHistory, familyHistory } = formData;

    const col1 = `
      ${sectionTitle('Clinic Info')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Clinic', clinicInfo.clinicName)}
        ${fieldRow('Contact', clinicInfo.ownersContact)}
        ${fieldRow('District', clinicInfo.district)}
        ${fieldRow('Town', clinicInfo.town)}
      </div>

      ${sectionTitle('Patient Info')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Name', formData.name)}
        ${fieldRow('Age', formData.age)}
        ${fieldRow('Address', formData.address)}
        ${fieldRow('Phone', formData.phoneNumber)}
        ${fieldRow('Religion', formData.religion)}
      </div>

      ${sectionTitle('Personal Details')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Occupation', opd.occupation)}
        ${fieldRow('Education', opd.education)}
        ${fieldRow('Tribe', opd.tribe)}
        ${fieldRow('Marital Status', opd.maritalStatus)}
        ${fieldRow('Next of Kin', opd.nextOfKin)}
        ${fieldRow('Relation with NOK', opd.relationshipWithNextOfKin)}
        ${fieldRow("NOK's Occupation", opd.nextOfKinOccupation)}
        ${fieldRow("NOK's Phone", opd.nextOfKinPhone)}
        ${fieldRow('Delivery Location', opd.deliveryLocation)}
        ${fieldRow('Post-Delivery', opd.postDeliveryLocation)}
        ${fieldRow('Gravida', opd.gravida)}
        ${fieldRow('Para', opd.para)}
        ${fieldRow('Abortions', opd.abortions)}
        ${fieldRow('Blood Group', opd.bloodGroup)}
        ${fieldRow('Rhesus', opd.rhesus)}
      </div>

      ${sectionTitle('Menstrual History')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Cycle Length', mh.cycleLength)}
        ${fieldRow('Flow Amount', mh.amountOfFlow)}
        ${fieldRow('Family Planning', mh.familyPlanningUsed)}
        ${mh.familyPlanningUsed === '' ? fieldRow('Reason No FP', mh.neverUsedFamilyPlanningReason) : ''}
      </div>
    `;

    const col2 = `
      ${sectionTitle('Present Pregnancy')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('LNMP', pp.firstDayOfLNMP)}
        ${fieldRow('EDD', pp.EDD)}
        ${fieldRow('Gestation', pp.periodOfGestation)}
        ${fieldRow('Hospitalization', pp.hospitalizationDetails)}
        ${fieldRow('Bleeding', pp.bleeding)}
        ${fieldRow('Vomiting', pp.vomiting)}
        ${fieldRow('Fevers/Cough/Flu', pp.feversCoughFluWeightLoss)}
      </div>

      ${sectionTitle('Physical Exam')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Height', pe.height)}
        ${fieldRow('Weight', pe.weight)}
        ${fieldRow('Temperature', pe.temperature)}
        ${fieldRow('Pulse', pe.pulse)}
        ${fieldRow('Eyes', pe.eyes)}
        ${fieldRow('Oral Thrush', pe.oralThrush)}
        ${fieldRow('Teeth', pe.teeth)}
        ${fieldRow('Neck', pe.neck)}
        ${fieldRow('Breasts', pe.breasts)}
        ${fieldRow('Mucous Membranes', pe.mucousMembranes)}
        ${fieldRow('Nails', pe.nails)}
        ${fieldRow('Palms', pe.palms)}
        ${fieldRow('Lymph Glands', pe.lymphGlands)}
        ${fieldRow('Anaemia', pe.anaemia)}
        ${fieldRow('Nutritional Status', pe.nutritionalStatus)}
        ${fieldRow('Heart', pe.heart)}
        ${fieldRow('Lungs', pe.lungs)}
        ${fieldRow('Legs', pe.legs)}
        ${fieldRow('Deformities', pe.deformities)}
        ${fieldRow('Herpes Zoster', pe.herpesZoster)}
      </div>

      ${sectionTitle('Pelvic Exam')}
      <div style="display:grid;grid-template-columns:1fr;gap:3px;margin-bottom:6px;">
        ${fieldRow('Vulva', pelv.vulva)}
        ${fieldRow('Vagina', pelv.vagina)}
        ${fieldRow('Cervix', pelv.cervix)}
        ${fieldRow('Moniliasis', pelv.moniliasis)}
      </div>
    `;

    const col3 = `
      ${sectionTitle('Medical History')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">${checkRows(medicalHistory)}</table>

      ${sectionTitle('OB/GYN History')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">${checkRows(obgynHistory)}</table>

      ${sectionTitle('Surgical History')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">${checkRows(surgicalHistory)}</table>

      ${sectionTitle('Family History')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">${checkRows(familyHistory)}</table>

      ${sectionTitle('Social History')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr><td style="padding:2px 6px;color:#555;font-size:10px;">Smoking</td><td style="padding:2px 6px;font-weight:600;font-size:10px;color:${socialHistory.smoking ? '#1a6e3c' : '#999'};">${boolLabel(socialHistory.smoking)}</td></tr>
        <tr><td style="padding:2px 6px;color:#555;font-size:10px;">Alcohol</td><td style="padding:2px 6px;font-weight:600;font-size:10px;color:${socialHistory.alcohol ? '#1a6e3c' : '#999'};">${boolLabel(socialHistory.alcohol)}</td></tr>
      </table>
      ${fieldRow('Health of Husband', socialHistory.healthOfHusband)}
    `;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>


        <title>Antenatal Card – ${formData.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 5mm 8mm;
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
            line-height: 1.35;
          }

          .page-header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1.5px solid #1a1a2e;
            padding-bottom: 6px;
          }
          
          .page-header h1 {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          
          .clinic-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #555;
            margin-top: 4px;
            padding: 0 4px;
          }
          
          .clinic-header span {
            font-weight: 600;
            color: #1a1a2e;
          }
          
          .page-header p {
            font-size: 8.5px;
            color: #666;
            margin-top: 4px;
          }

          .columns {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0 12px;
            align-items: start;
          }

          .col {
            padding: 0 4px;
          }
          
          .col + .col {
            border-left: 0.5px dashed #ccc;
          }

          .print-btn {
            display: block;
            margin: 10px auto 0;
            padding: 6px 24px;
            background: #1a1a2e;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
          }

          @media print {
            .print-btn { display: none !important; }
            body { 
              width: 100%;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .col + .col {
              border-left: 0.5px solid #ccc;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-header">
          <h1>ANTENATAL CARE CARD</h1>
          <div class="clinic-header">
            <div>🏥 <span>${clinicInfo.clinicName || 'Clinic'}</span></div>
            <div>📞 <span>${clinicInfo.ownersContact || 'N/A'}</span></div>
            <div>📍 <span>${clinicInfo.district || ''} | ${clinicInfo.town || ''}</span></div>
          </div>
          <p>Patient: <strong>${formData.name}</strong> | Maternity ID: ${props.maternity_id || 'N/A'} | Printed: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="columns">
          <div class="col">${col1}</div>
          <div class="col">${col2}</div>
          <div class="col">${col3}</div>
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
  // ─── END PRINT HANDLER ────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1040,
        }}
        onClick={handleClose}
      />
      
      {/* Modal Card */}
      <div
        onClick={handleCardClick}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '98vw',
          height: '98vh',
          maxWidth: '1600px',
          maxHeight: '98vh',
          backgroundColor: '#f5f5f5',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1050,
        }}
      >
        <ToastContainer />

        {/* ── TOP HEADER with Clinic Info ── */}
        <div
          style={{
            flexShrink: 0,
            backgroundColor: '#fff',
            borderBottom: '2px solid #0066cc',
            padding: '8px 16px',
            zIndex: 1,
          }}
        >
          {/* Close X top-right */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: '8px', right: '10px',
              padding: '4px 10px', backgroundColor: 'transparent',
              color: '#dc3545', border: 'none', fontSize: '22px', cursor: 'pointer',
              zIndex: 1060,
            }}
          >
            &times;
          </button>

          {/* Clinic Header Banner */}
          <div style={{
            backgroundColor: '#0066cc',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              🏥 {clinicInfo.clinicName || 'LIFESURE MEDICARE'}
            </div>
            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <span>📞 Contact: {clinicInfo.ownersContact || 'N/A'}</span>
              <span>📍 District: {clinicInfo.district || 'N/A'}</span>
              <span>🏘️ Town: {clinicInfo.town || 'N/A'}</span>
            </div>
          </div>

          {/* Button Group */}
          <div className="button-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="prompt-button" onClick={() => handleButtonClick('obstetricHistory')} style={{ padding: '6px 12px', fontSize: '12px' }}>
              Obstetric History
            </button>
            <button className="prompt-button" onClick={() => handleButtonClick('antenatalProgress')} style={{ padding: '6px 12px', fontSize: '12px' }}>
              Antenatal Progress Examination
            </button>
            <button className="prompt-button" onClick={() => handleButtonClick('partogram')} style={{ padding: '6px 12px', fontSize: '12px' }}>
              Partogram
            </button>
          </div>
        </div>

        {/* ── DYNAMIC PROMPTS ── */}
        {activePrompt === 'obstetricHistory' && (
          <ObstetricHistoryPrompt
            {...props}
            {...ANCdetails}
            clinicInfo={clinicInfo}
            onClose={(data) => { console.log('Data from ObstetricHistoryPrompt:', data); handleClosePrompt(data); }}
          />
        )}
        {activePrompt === 'antenatalProgress' && (
          <AntenatalProgressPrompt
            {...props}
            {...ANCdetails}
            clinicInfo={clinicInfo}
            onClose={(data) => { console.log('Data from AntenatalProgressPrompt:', data); handleClosePrompt(data); }}
          />
        )}
        {activePrompt === 'partogram' && (
          <PartogramPrompt
            {...props}
            {...ANCdetails}
            clinicInfo={clinicInfo}
            onClose={(data) => { console.log('Data from PartogramPrompt:', data); handleClosePrompt(data); }}
          />
        )}

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 16px' }}>
          {/* Title */}
          <h2 style={{
            fontSize: '20px', fontFamily: "'Georgia', serif", fontWeight: 'bold',
            color: '#0066cc', textAlign: 'center', margin: '16px 0 12px',
          }}>
            Antenatal Card
          </h2>

          {/* Patient Information Section - Simplified Header */}
          <section style={{
            padding: '12px', width: '100%', backgroundColor: '#f0f7ff',
            border: '1px solid #b8d9e6', borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>
              Patient Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              <div><strong>Name:</strong> {formData.name}</div>
              <div><strong>Age:</strong> {formData.age}</div>
              <div><strong>Address:</strong> {formData.address}</div>
              <div><strong>Phone:</strong> {formData.phoneNumber}</div>
              <div><strong>Religion:</strong> {formData.religion || 'N/A'}</div>
            </div>
          </section>

          {/* Other Personal Details - Simplified */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Other Personal Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
              {[
                { label: 'Occupation', field: 'occupation' },
                { label: 'Education', field: 'education' },
                { label: 'Tribe', field: 'tribe' },
                { label: 'Marital Status', field: 'maritalStatus' },
                { label: 'Next of Kin', field: 'nextOfKin' },
                { label: 'Relation with NOK', field: 'relationshipWithNextOfKin' },
                { label: "NOK's Occupation", field: 'nextOfKinOccupation' },
                { label: "NOK's Phone", field: 'nextOfKinPhone' },
                { label: 'Delivery Location', field: 'deliveryLocation' },
                { label: 'Post-Delivery Location', field: 'postDeliveryLocation' },
                { label: 'Gravida', field: 'gravida' },
                { label: 'Para', field: 'para' },
                { label: 'Abortions', field: 'abortions' },
                { label: 'Blood Group', field: 'bloodGroup' },
                { label: 'Rhesus Factor', field: 'rhesus' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <strong>{label}:</strong>
                  <textarea
                    value={formData.otherPersonalDetails[field]}
                    onChange={(e) => handleChange('otherPersonalDetails', field, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }}
                    rows="2"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Medical History - Checkboxes */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Previous Illness (Medical History)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
              {Object.keys(formData.medicalHistory).map((condition) => (
                <label key={condition} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.medicalHistory[condition]}
                    onChange={(e) => handleChange('medicalHistory', condition, e.target.checked)}
                  />
                  <span>{condition.split(/(?=[A-Z])/).join(' ')}</span>
                </label>
              ))}
            </div>
          </section>

          {/* OB/GYN History */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>OB/GYN History</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
              {Object.keys(formData.obgynHistory).map((condition) => (
                <label key={condition} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.obgynHistory[condition]}
                    onChange={(e) => handleChange('obgynHistory', condition, e.target.checked)}
                  />
                  <span>{condition.split(/(?=[A-Z])/).join(' ')}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Surgical History */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Surgical History</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
              {Object.keys(formData.surgicalHistory).map((condition) => (
                <label key={condition} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.surgicalHistory[condition]}
                    onChange={(e) => handleChange('surgicalHistory', condition, e.target.checked)}
                  />
                  <span>{condition.split(/(?=[A-Z])/).join(' ')}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Social History */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Social History</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
              {['smoking', 'alcohol'].map((field) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.socialHistory[field]}
                    onChange={(e) => handleChange('socialHistory', field, e.target.checked)}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{field}</span>
                </label>
              ))}
            </div>
            <div>
              <strong>Health of Husband:</strong>
              <textarea
                value={formData.socialHistory.healthOfHusband}
                onChange={(e) => handleChange('socialHistory', 'healthOfHusband', e.target.value)}
                placeholder="Describe health of husband"
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                rows="2"
              />
            </div>
          </section>

          {/* Family History */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Family History</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
              {Object.keys(formData.familyHistory).map((condition) => (
                <label key={condition} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.familyHistory[condition]}
                    onChange={(e) => handleChange('familyHistory', condition, e.target.checked)}
                  />
                  <span>{condition.split(/(?=[A-Z])/).join(' ')}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Menstrual and Contraceptive History */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Menstrual and Contraceptive History</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Length of Menses (Number of Days):</strong>
                <input
                  type="text"
                  value={formData.menstrualHistory.cycleLength}
                  onChange={(e) => handleChange('menstrualHistory', 'cycleLength', e.target.value)}
                  placeholder="Enter the number of days"
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                />
              </div>
              <div>
                <strong>Amount of Flow:</strong>
                <select
                  value={formData.menstrualHistory.amountOfFlow}
                  onChange={(e) => handleChange('menstrualHistory', 'amountOfFlow', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                >
                  <option value="">Select Amount of Flow</option>
                  <option value="noMenses">No Menses At All</option>
                  <option value="normal">Normal</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div>
                <strong>Any Family Planning Ever Used:</strong>
                <textarea
                  value={formData.menstrualHistory.familyPlanningUsed}
                  onChange={(e) => handleChange('menstrualHistory', 'familyPlanningUsed', e.target.value)}
                  placeholder="Describe if any family planning was ever used"
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                  rows="2"
                />
              </div>
              {formData.menstrualHistory.familyPlanningUsed === '' && (
                <div>
                  <strong>If Never Used Any Family Planning, Describe Why:</strong>
                  <textarea
                    value={formData.menstrualHistory.neverUsedFamilyPlanningReason}
                    onChange={(e) => handleChange('menstrualHistory', 'neverUsedFamilyPlanningReason', e.target.value)}
                    placeholder="Describe why family planning was never used"
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                    rows="2"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Present Pregnancy */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Present Pregnancy</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div><strong>First Day of LNMP:</strong><input type="text" value={formData.presentPregnancy.firstDayOfLNMP} onChange={(e) => handleChange('presentPregnancy', 'firstDayOfLNMP', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} /></div>
              <div><strong>EDD (Estimated Due Date):</strong><input type="text" value={formData.presentPregnancy.EDD} onChange={(e) => handleChange('presentPregnancy', 'EDD', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} /></div>
              <div><strong>Period of Gestation:</strong><input type="text" value={formData.presentPregnancy.periodOfGestation} onChange={(e) => handleChange('presentPregnancy', 'periodOfGestation', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} /></div>
              <div><strong>Hospitalization Details:</strong><textarea value={formData.presentPregnancy.hospitalizationDetails} onChange={(e) => handleChange('presentPregnancy', 'hospitalizationDetails', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} rows="2" /></div>
              <div><strong>Bleeding:</strong><textarea value={formData.presentPregnancy.bleeding} onChange={(e) => handleChange('presentPregnancy', 'bleeding', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} rows="2" /></div>
              <div><strong>Vomiting:</strong><textarea value={formData.presentPregnancy.vomiting} onChange={(e) => handleChange('presentPregnancy', 'vomiting', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} rows="2" /></div>
              <div><strong>Fevers, Cough, Flu, Weight Loss:</strong><textarea value={formData.presentPregnancy.feversCoughFluWeightLoss} onChange={(e) => handleChange('presentPregnancy', 'feversCoughFluWeightLoss', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} rows="2" /></div>
            </div>
          </section>

          {/* Physical Examination */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Physical Examination</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              {['height','temperature','weight','pulse','oralThrush','teeth','neck','breasts','legs',
                'deformities','lymphGlands','herpesZoster','nutritionalStatus','anaemia','eyes',
                'mucousMembranes','nails','palms','heart','lungs'].map((field) => (
                <div key={field}>
                  <strong>{field.split(/(?=[A-Z])/).join(' ')}:</strong>
                  {['height', 'temperature', 'weight', 'pulse'].includes(field) ? (
                    <input type="text" value={formData.physicalExam[field]} onChange={(e) => handleChange('physicalExam', field, e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }} />
                  ) : (
                    <textarea value={formData.physicalExam[field]} onChange={(e) => handleChange('physicalExam', field, e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '2px' }} rows="2" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Pelvic Examination */}
          <section style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#0066cc' }}>Pelvic Examination</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {['vulva', 'vagina', 'cervix', 'moniliasis'].map((field) => (
                <div key={field}>
                  <strong>{field.split(/(?=[A-Z])/).join(' ')}:</strong>
                  <textarea value={formData.pelvicExam[field]} onChange={(e) => handleChange('pelvicExam', field, e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} rows="2" />
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: '10px' }} />
        </div>

        {/* ── STICKY BOTTOM ACTION BAR ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#fff',
          borderTop: '2px solid #e0e0e0',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.10)',
          zIndex: 100,
        }}>
          <button onClick={handleSubmit} style={{ fontSize: '13px', padding: '8px 24px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            💾 Submit Antenatal Details
          </button>
          <button onClick={handlePrint} style={{ fontSize: '13px', padding: '8px 24px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            🖨 Print
          </button>
          <button type="button" onClick={handleClose} style={{ fontSize: '13px', padding: '8px 24px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            ✕ Close
          </button>
        </div>
      </div>
    </>
  );
};

export default AntenatalPrompt;