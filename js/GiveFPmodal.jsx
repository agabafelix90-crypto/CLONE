import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { urls } from './config.dev';

/* ─────────────────────────────────────────────────────────────
   NOTIFICATION COMPONENT
──────────────────────────────────────────────────────────────*/
function Notification({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => { onClose(); }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    position: 'fixed', top: '20px', right: '20px',
    padding: '12px 20px', borderRadius: '8px',
    backgroundColor: type === 'error' ? '#fff1f1' : '#f0fdf4',
    color: type === 'error' ? '#b91c1c' : '#15803d',
    border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    zIndex: 100000, maxWidth: '420px',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', fontWeight: 500,
    animation: 'slideIn 0.3s ease-out',
  };

  return ReactDOM.createPortal(
    <div style={styles}>{message}</div>,
    document.body
  );
}

/* ─────────────────────────────────────────────────────────────
   LOADING SPINNER
──────────────────────────────────────────────────────────────*/
function LoadingSpinner() {
  return (
    <>
      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', minHeight:'300px' }}>
        <div style={{
          width:'48px', height:'48px', border:'4px solid #e2e8f0',
          borderTop:'4px solid #0e7b4e', borderRadius:'50%', animation:'spin 0.9s linear infinite',
        }} />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES — pure white theme
──────────────────────────────────────────────────────────────*/
const S = {
  overlay: {
    position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.45)',
    backdropFilter:'blur(4px)', display:'flex', justifyContent:'center',
    alignItems:'center', zIndex:1000,
  },
  modal: {
    width:'95%', maxWidth:'1200px', height:'92vh', backgroundColor:'#ffffff',
    borderRadius:'14px', boxShadow:'0 12px 48px rgba(0,0,0,0.15)',
    display:'flex', flexDirection:'column', overflow:'hidden',
    border:'1px solid #e2e8f0',
  },
  header: {
    padding:'24px 32px 20px', borderBottom:'1px solid #e2e8f0',
    background:'#ffffff',
  },
  title: {
    fontFamily:"'Syne',sans-serif", fontSize:'1.2rem', fontWeight:700,
    color:'#0f172a', marginBottom:'14px',
  },
  infoBox: {
    background:'#f8fafc', padding:'14px 20px', borderRadius:'10px',
    marginBottom:'14px', border:'1px solid #e2e8f0',
  },
  infoRow: { display:'flex', gap:'28px', flexWrap:'wrap', marginBottom:'6px' },
  infoItem: { fontSize:'0.88rem', color:'#475569' },
  infoLabel: { fontWeight:600, color:'#0f172a', marginRight:'5px' },
  checkboxLabel: {
    display:'flex', alignItems:'center', gap:'10px', fontSize:'0.9rem',
    color:'#0f172a', marginBottom:'14px', padding:'11px 16px',
    background:'#f8fafc', borderRadius:'8px', cursor:'pointer', userSelect:'none',
    border:'1px solid #e2e8f0',
  },
  warningBox: {
    fontSize:'0.82rem', color:'#b45309', padding:'10px 14px',
    background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px',
  },
  content: { flex:1, overflowY:'auto', padding:'28px 32px', background:'#ffffff' },
  table: {
    width:'100%', borderCollapse:'collapse', marginBottom:'28px',
    background:'#ffffff', borderRadius:'10px',
    boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #e2e8f0',
    tableLayout:'fixed',
  },
  th: {
    padding:'12px 16px', textAlign:'left', background:'#f8fafc',
    color:'#475569', fontSize:'0.78rem', fontWeight:700,
    borderBottom:'2px solid #e2e8f0', fontFamily:"'Syne',sans-serif",
    letterSpacing:'0.03em', textTransform:'uppercase',
  },
  td: {
    padding:'10px 14px', borderBottom:'1px solid #f1f5f9',
    verticalAlign:'middle', background:'#ffffff',
  },
  plainInput: {
    width:'100%', padding:'8px 11px', border:'1px solid #e2e8f0',
    borderRadius:'6px', fontSize:'0.88rem', color:'#0f172a',
    background:'#ffffff', outline:'none', boxSizing:'border-box',
    transition:'border 0.15s, box-shadow 0.15s',
  },
  readonlyInput: {
    width:'100%', padding:'8px 11px', border:'1px solid #e2e8f0',
    borderRadius:'6px', fontSize:'0.88rem', color:'#64748b',
    background:'#f8fafc', outline:'none', boxSizing:'border-box',
  },
  iconBtn: {
    width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e2e8f0',
    background:'#ffffff', color:'#475569', fontSize:'1rem', cursor:'pointer',
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    transition:'background 0.12s',
  },
  iconBtnDanger: { background:'#dc2626', color:'#fff', border:'none' },
  radioLabel: {
    display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem',
    color:'#475569', cursor:'pointer',
  },
  radioGroup: { display:'flex', flexDirection:'column', gap:'10px', marginTop:'8px' },
  dateInput: {
    marginLeft:26, padding:'8px 12px',
    border:'1px solid #e2e8f0', borderRadius:6,
    fontSize:'0.88rem', outline:'none', marginTop:'4px',
    background:'#ffffff', color:'#0f172a',
  },
  footer: {
    padding:'18px 32px', borderTop:'1px solid #e2e8f0', background:'#ffffff',
    display:'flex', justifyContent:'flex-end', gap:'10px',
  },
  btnPrimary: {
    padding:'10px 32px', background:'#0e7b4e', color:'#fff', border:'none',
    borderRadius:'7px', fontSize:'0.9rem', fontWeight:600, cursor:'pointer',
    fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.01em',
    transition:'background 0.15s',
  },
  btnSecondary: {
    padding:'10px 28px', background:'#f8fafc', color:'#475569',
    border:'1px solid #e2e8f0', borderRadius:'7px', fontSize:'0.9rem',
    fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
  },
  // Batch/expiry cell badges
  batchCell: {
    display:'flex', flexDirection:'column', gap:'5px',
  },
  batchBadge: {
    display:'inline-flex', alignItems:'center', gap:'5px',
    padding:'3px 9px', borderRadius:'5px',
    fontSize:'0.75rem', fontWeight:500,
    background:'#eff6ff', color:'#1d4ed8',
    border:'1px solid #bfdbfe',
  },
  expiryBadge: {
    display:'inline-flex', alignItems:'center', gap:'5px',
    padding:'3px 9px', borderRadius:'5px',
    fontSize:'0.75rem', fontWeight:500,
    background:'#fefce8', color:'#854d0e',
    border:'1px solid #fde68a',
  },
  naBadge: {
    display:'inline-flex', alignItems:'center', gap:'5px',
    padding:'3px 9px', borderRadius:'5px',
    fontSize:'0.75rem', fontWeight:500,
    background:'#f8fafc', color:'#94a3b8',
    border:'1px solid #e2e8f0',
  },
};

/* ─────────────────────────────────────────────────────────────
   BATCH / EXPIRY CELL
   Shows populated values or clear "N/A" badges
──────────────────────────────────────────────────────────────*/
function BatchExpiryCell({ row }) {
  const hasBatch = row.batch_number && row.batch_number !== 'null' && row.batch_number !== null;
  const hasExpiry = row.expiry_date && row.expiry_date !== 'null' && row.expiry_date !== null;

  return (
    <div style={S.batchCell}>
      {hasBatch
        ? <span style={S.batchBadge}>📦 {row.batch_number}</span>
        : <span style={S.naBadge}>📦 No Batch</span>
      }
      {hasExpiry
        ? <span style={S.expiryBadge}>📅 {row.expiry_date}</span>
        : <span style={S.naBadge}>📅 No Expiry</span>
      }
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DRUG SEARCH INPUT
──────────────────────────────────────────────────────────────*/
function DrugSearchInput({ value, allDrugs, disabled, onDrugTyped, onDrugSelected, showExpiryBatch }) {
  const [datalistId] = useState(`drug-list-${Math.random().toString(36).slice(2)}`);

  // Build the label shown alongside the drug name in the dropdown suggestion
  const getDrugLabel = (drug) => {
    const parts = [];

    // Quantity available
    const qty = drug.Quantity ?? drug.quantity;
    parts.push(`Qty: ${qty != null ? qty : 'N/A'}`);

    if (showExpiryBatch) {
      const batch = drug.batch_number && drug.batch_number !== 'null' ? drug.batch_number : 'No Batch';
      const expiry = drug.expiry_date && drug.expiry_date !== 'null' ? drug.expiry_date : 'No Expiry';
      parts.push(`Batch: ${batch}`);
      parts.push(`Exp: ${expiry}`);
    }

    if (drug.Packaging) parts.push(`[${drug.Packaging}]`);

    return parts.join('  |  ');
  };

  const handleChange = (e) => {
    const text = e.target.value;
    onDrugTyped(text);

    // Try exact match first, then prefix match
    const match = allDrugs.find(d => d.Drug.toLowerCase() === text.toLowerCase())
      || allDrugs.find(d => text.toLowerCase().startsWith(d.Drug.toLowerCase()));

    if (match) onDrugSelected(match);
  };

  const handleSelect = (e) => {
    const raw = e.target.value;
    const match = allDrugs.find(d => d.Drug.toLowerCase() === raw.toLowerCase());
    if (match) onDrugSelected(match);
  };

  return (
    <>
      <input
        type="text"
        list={datalistId}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        disabled={disabled}
        placeholder="Type to search drug…"
        autoComplete="off"
        style={{
          ...S.plainInput,
          background: disabled ? '#f8fafc' : '#ffffff',
        }}
      />
      <datalist id={datalistId}>
        {allDrugs.map((drug, idx) => (
          // value = what gets typed into the input (drug name only)
          // label = the extra info shown in the dropdown suggestion row
          <option
            key={drug.drug_id || idx}
            value={drug.Drug}
            label={getDrugLabel(drug)}
          />
        ))}
      </datalist>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────*/
function GiveFPmodal({ clientDetails, onClose }) {
  const emptyRow = () => ({
    drug: '', packaging: '', quantity: '',
    drug_id: null, batch_number: null, expiry_date: null,
  });

  const [rows, setRows] = useState([emptyRow()]);
  const [allDrugs, setAllDrugs] = useState([]);
  const [noDrugsGiven, setNoDrugsGiven] = useState(false);
  const [nextDoseOption, setNextDoseOption] = useState('none');
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [token] = useState(clientDetails.token);

  const showExpiryBatch =
    clientDetails.use_drug_expiry_date === 'yes' ||
    clientDetails.use_drug_batch_numbers === 'yes';

  const addNotification = (message, type = 'error') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
  };
  const removeNotification = (id) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  /* ── Fetch drug inventory ── */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(urls.fetchdispensary2, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error('Failed to load drug inventory');
        const data = await res.json();
        if (isMounted) {
          const normalised = data.map((item) => ({
            Drug: item.Drug || item.drug || '',
            Quantity: item.Quantity ?? item.quantity ?? 0,
            Selling_Price: item.Selling_Price || item.selling_price || '',
            Packaging: item.Packaging || item.packaging || '',
            Clinic: item.Clinic || item.clinic || '',
            drug_id: item.drug_id || item.id || null,
            batch_number: item.batch_number || null,
            expiry_date: item.expiry_date || null,
          }));
          setAllDrugs(normalised);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          addNotification('Failed to load drug inventory. Please refresh.', 'error');
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [token]);

  /* ── Row helpers ── */
  const updateRow = (index, patch) =>
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleDrugTyped = (index, text) =>
    updateRow(index, {
      drug: text, drug_id: null, packaging: '',
      batch_number: null, expiry_date: null,
    });

  // When a drug is selected from the datalist, populate ALL fields including batch/expiry
  const handleDrugSelected = (index, suggestion) => {
    updateRow(index, {
      drug: suggestion.Drug,
      packaging: suggestion.Packaging || '',
      drug_id: suggestion.drug_id,
      quantity: rows[index].quantity || '',
      // Always set batch/expiry — null means "no batch/expiry" which is valid
      batch_number: suggestion.batch_number ?? null,
      expiry_date: suggestion.expiry_date ?? null,
    });
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    if (!last.drug || !last.quantity) {
      addNotification('Fill in the drug name and quantity before adding another row.', 'error');
      return;
    }
    setRows(prev => [...prev, emptyRow()]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) {
      setRows([emptyRow()]);
    } else {
      setRows(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleNoDrugsChange = (e) => {
    setNoDrugsGiven(e.target.checked);
    if (e.target.checked) setRows([emptyRow()]);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!noDrugsGiven) {
      if (rows.some(r => !r.drug || !r.quantity)) {
        addNotification('Some rows are incomplete. Fill in drug and quantity for every row.', 'error');
        return;
      }
      if (rows.some(r => r.drug && !r.drug_id)) {
        addNotification('Some drugs are missing IDs. Please select them from the dropdown again.', 'error');
        return;
      }
    }
    if (nextDoseOption === 'specific' && !nextDoseDate) {
      addNotification('Please pick the next appointment date.', 'error');
      return;
    }

    setSubmitting(true);

    const base = {
      fp_id: clientDetails.fp_id,
      first_name: clientDetails.first_name,
      last_name: clientDetails.last_name.trim(),
      full_name: `${clientDetails.first_name.trim()} ${clientDetails.last_name.trim()}`,
      age: clientDetails.age,
      sex: clientDetails.sex,
      phone_number: clientDetails.phone_number,
      method: clientDetails.method,
      token,
      next_appointment_date: nextDoseOption === 'specific' ? nextDoseDate : null,
      no_need_to_return: nextDoseOption === 'none',
    };

    // Build treatment plan — batch/expiry always included; null → explicit "no batch/expiry"
    const buildTreatmentPlan = () =>
      rows
        .filter(r => r.drug && r.quantity)
        .map(r => ({
          drug: r.drug,
          packaging: r.packaging,
          quantity: r.quantity,
          drug_id: r.drug_id,
          batch_number: r.batch_number ?? null,   // null = no batch
          expiry_date: r.expiry_date ?? null,     // null = no expiry
        }));

    const payload = noDrugsGiven
      ? { ...base, no_drugs_given: true, message: 'No drugs were administered during this visit' }
      : { ...base, no_drugs_given: false, treatment_plan: buildTreatmentPlan() };

    try {
      const res = await fetch(urls.submitFPdrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      if (data.success) {
        addNotification('Family planning drugs submitted successfully!', 'success');
        try {
          await fetch(urls.assignAverage3, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (e) { console.error('assignAverage error:', e); }
        setTimeout(onClose, 2000);
      }
    } catch (e) {
      console.error(e);
      addNotification(`Error: ${e.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.modal, justifyContent:'center', alignItems:'center' }}>
          <LoadingSpinner />
          {notifications.map(n => (
            <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Column widths depending on mode ── */
  const colW = showExpiryBatch
    ? { drug:'32%', packaging:'18%', qty:'10%', batchExpiry:'28%', actions:'12%' }
    : { drug:'42%', packaging:'24%', qty:'16%', actions:'18%' };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* Global notifications */}
        {notifications.map(n => (
          <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
        ))}

        {/* ── HEADER ── */}
        <div style={S.header}>
          <h3 style={S.title}>Record Drugs Used During Family Planning</h3>

          <div style={S.infoBox}>
            <div style={S.infoRow}>
              <span style={S.infoItem}>
                <span style={S.infoLabel}>Client:</span>
                {clientDetails.first_name} {clientDetails.last_name}
              </span>
              <span style={S.infoItem}><span style={S.infoLabel}>Age:</span>{clientDetails.age}</span>
              <span style={S.infoItem}><span style={S.infoLabel}>Sex:</span>{clientDetails.sex}</span>
            </div>
            <div style={S.infoRow}>
              <span style={S.infoItem}><span style={S.infoLabel}>Phone:</span>{clientDetails.phone_number}</span>
              <span style={S.infoItem}><span style={S.infoLabel}>Method:</span>{clientDetails.method}</span>
            </div>
            {showExpiryBatch && (
              <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px dashed #e2e8f0' }}>
                <span style={{ fontSize:'0.78rem', color:'#0e7b4e', fontWeight:600 }}>
                  ✓ Batch &amp; expiry date tracking is enabled for this clinic
                </span>
              </div>
            )}
          </div>

          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={noDrugsGiven}
              onChange={handleNoDrugsChange}
              style={{ width:17, height:17, accentColor:'#0e7b4e', cursor:'pointer' }}
            />
            No drugs were given to this patient during this visit
          </label>

          {!noDrugsGiven && (
            <div style={S.warningBox}>
              ⚠ Please record everything given to this patient, however small (syringe, cannula, etc.),
              to enable accurate calculations.
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div style={S.content}>
          {!noDrugsGiven && (
            <table style={S.table}>
              <colgroup>
                <col style={{ width: colW.drug }} />
                <col style={{ width: colW.packaging }} />
                <col style={{ width: colW.qty }} />
                {showExpiryBatch && <col style={{ width: colW.batchExpiry }} />}
                <col style={{ width: colW.actions }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={S.th}>Drug Name</th>
                  <th style={S.th}>Packaging</th>
                  <th style={S.th}>Qty</th>
                  {showExpiryBatch && <th style={S.th}>Batch / Expiry</th>}
                  <th style={{ ...S.th, textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>

                    {/* Drug search */}
                    <td style={S.td}>
                      <DrugSearchInput
                        value={row.drug}
                        allDrugs={allDrugs}
                        disabled={noDrugsGiven}
                        showExpiryBatch={showExpiryBatch}
                        onDrugTyped={(text) => handleDrugTyped(idx, text)}
                        onDrugSelected={(s) => handleDrugSelected(idx, s)}
                      />
                    </td>

                    {/* Packaging — auto-filled */}
                    <td style={S.td}>
                      <input
                        type="text"
                        style={S.readonlyInput}
                        value={row.packaging}
                        readOnly
                        placeholder="Auto-filled"
                      />
                    </td>

                    {/* Quantity */}
                    <td style={S.td}>
                      <input
                        type="number"
                        style={S.plainInput}
                        value={row.quantity}
                        placeholder="Qty"
                        min="1"
                        disabled={noDrugsGiven}
                        onChange={(e) =>
                          updateRow(idx, { quantity: e.target.value ? parseInt(e.target.value, 10) : '' })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addRow()}
                      />
                    </td>

                    {/* Batch / Expiry — populated from drug selection, null shown as N/A */}
                    {showExpiryBatch && (
                      <td style={S.td}>
                        {row.drug
                          ? <BatchExpiryCell row={row} />
                          : <span style={{ fontSize:'0.78rem', color:'#cbd5e1' }}>Select a drug first</span>
                        }
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ ...S.td, textAlign:'center', whiteSpace:'nowrap' }}>
                      <button
                        type="button"
                        style={{ ...S.iconBtn, marginRight:6 }}
                        onClick={addRow}
                        disabled={rows.length >= 10}
                        title="Add row"
                      >+</button>
                      <button
                        type="button"
                        style={{ ...S.iconBtn, ...S.iconBtnDanger }}
                        onClick={() => removeRow(idx)}
                        title="Remove row"
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Next appointment ── */}
          <div style={{
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:'10px', padding:'18px 20px',
          }}>
            <h4 style={{ fontSize:'0.88rem', marginBottom:'12px', color:'#0f172a', fontWeight:700 }}>
              Next Appointment
            </h4>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'12px' }}>
              If the family planning method has an expiry date, select the next appointment date.
            </p>
            <div style={S.radioGroup}>
              <label style={S.radioLabel}>
                <input
                  type="radio" name="nextDose" style={{ accentColor:'#0e7b4e' }}
                  value="specific" checked={nextDoseOption === 'specific'}
                  onChange={() => setNextDoseOption('specific')}
                />
                On a specific date
              </label>

              {nextDoseOption === 'specific' && (
                <div>
                  <input
                    type="date" value={nextDoseDate}
                    onChange={(e) => setNextDoseDate(e.target.value)}
                    style={S.dateInput}
                  />
                </div>
              )}

              <label style={S.radioLabel}>
                <input
                  type="radio" name="nextDose" style={{ accentColor:'#0e7b4e' }}
                  value="none" checked={nextDoseOption === 'none'}
                  onChange={() => { setNextDoseOption('none'); setNextDoseDate(''); }}
                />
                No need to return
              </label>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={S.footer}>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={onClose}
          >Cancel</button>
          <button
            type="button"
            style={{
              ...S.btnPrimary,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GiveFPmodal;