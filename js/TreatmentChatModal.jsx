import React, { useState, useEffect, useRef, useCallback } from 'react';
import { urls } from './config.dev';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDICAL_SUPPLY_KEYWORDS = [
    'cannula','syringe','bandage','strapping','gauze','tape',
    'dressing','swab','needle','catheter','tubing','gloves',
    'mask','pad','cotton','plaster','compress'
];

const ROUTE_OPTIONS = [
    'IV','Oral','IM','SC','Topical','Inhalation','Rectal',
    'Sublingual','Nasal','Ophthalmic','Otic','Vaginal','Other'
];

const EMPTY_ROW = (showBatchExpiry) => ({
    drug: '', packaging: '', dosage: '', route: '', quantity: '',
    includeInChart: true, drug_id: null, selectedInventoryId: null,
    batch_number: showBatchExpiry ? 'No batch' : null,
    expiry_date:  showBatchExpiry ? 'No expiry' : null,
});

// ─── Helper: match treatment rows against prescription text ──────────────────
// Updated logic: Identify drug name only (not packaging first)
// Prescription lines look like:
//   • Rectal furosemide injection 20mg 6 micrograms 3 hourly for 8 months then ----(3 Ampules)
// Strategy:
//   1. Split prescription into lines.
//   2. For each treatment row, check if the line contains the drug_name (case-insensitive)
//   3. If found AND quantity + given_sofar are not null → include in table
//
function matchTreatmentRowsToPrescription(treatmentRows, prescriptionText) {
    if (!prescriptionText || !treatmentRows?.length) return [];

    const lines = prescriptionText
        .split('\n')
        .map(l => l.replace(/^[\s•\-*]+/, '').trim()) // strip bullets
        .filter(Boolean);

    const matched = [];

    for (const row of treatmentRows) {
        // Only include if both quantity and given_sofar are not null
        if (row.quantity == null || row.given_sofar == null) continue;

        const drugLower = (row.drug_name || '').toLowerCase().trim();
        if (!drugLower) continue;

        for (const line of lines) {
            const lineLower = line.toLowerCase();
            
            // Check if the line contains the drug name
            if (lineLower.includes(drugLower)) {
                const remaining = Math.max(0, row.quantity - row.given_sofar);
                matched.push({
                    drug_name:   row.drug_name,
                    packaging:   row.packaging,
                    quantity:    row.quantity,
                    given_sofar: row.given_sofar,
                    remaining,
                });
                break; // found a matching line for this row, move to next row
            }
        }
    }

    return matched;
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const S = {
    overlay: {
        position:'fixed',top:0,left:0,width:'100%',height:'100%',
        backgroundColor:'rgba(15,23,42,0.75)',display:'flex',
        justifyContent:'center',alignItems:'center',zIndex:1000,
        backdropFilter:'blur(3px)',
    },
    modal: {
        backgroundColor:'#ffffff',borderRadius:'12px',
        width:'97%',maxWidth:'1700px',height:'93vh',
        display:'flex',flexDirection:'column',
        boxShadow:'0 25px 60px rgba(0,0,0,0.25)',overflow:'hidden',
    },
    header: {
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 28px',borderBottom:'1px solid #e2e8f0',
        backgroundColor:'#f8fafc',flexShrink:0,
    },
    headerTitle: {
        margin:0,fontSize:'18px',fontWeight:700,color:'#0f172a',
        letterSpacing:'-0.3px',display:'flex',alignItems:'center',gap:'10px',
    },
    headerBadge: {
        fontSize:'11px',fontWeight:600,backgroundColor:'#dbeafe',
        color:'#1d4ed8',padding:'3px 10px',borderRadius:'20px',letterSpacing:'0.3px',
    },
    closeBtn: {
        background:'none',border:'none',cursor:'pointer',
        color:'#64748b',fontSize:'22px',lineHeight:1,padding:'4px 8px',
        borderRadius:'6px',transition:'background 0.15s',
    },
    body: {
        display:'flex',flex:1,overflow:'hidden',
    },
    // LEFT PANEL
    leftPanel: {
        width:'280px',minWidth:'260px',backgroundColor:'#f8fafc',
        borderRight:'1px solid #e2e8f0',display:'flex',
        flexDirection:'column',flexShrink:0,overflow:'hidden',
    },
    leftPanelHeader: {
        padding:'16px 20px 12px',borderBottom:'1px solid #e2e8f0',
    },
    leftPanelTitle: {
        margin:0,fontSize:'12px',fontWeight:700,
        color:'#64748b',letterSpacing:'0.8px',textTransform:'uppercase',
    },
    prescriptionBody: {
        flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:'16px',
    },
    prescriptionText: {
        fontSize:'13px',lineHeight:'1.7',color:'#334155',
        whiteSpace:'pre-wrap',fontFamily:'\'Courier New\', monospace',
        margin:0,
    },
    noPrescription: {
        fontSize:'13px',color:'#94a3b8',fontStyle:'italic',textAlign:'center',
        marginTop:'40px',
    },
    // ── Matched rows summary table ──
    summarySection: {
        borderTop:'1px solid #e2e8f0',paddingTop:'14px',marginTop:'4px',
    },
    summaryTitle: {
        margin:'0 0 10px',fontSize:'11px',fontWeight:700,
        color:'#64748b',letterSpacing:'0.8px',textTransform:'uppercase',
    },
    summaryTable: {
        width:'100%',borderCollapse:'collapse',fontSize:'11.5px',
    },
    summaryTh: {
        padding:'5px 6px',backgroundColor:'#e2e8f0',color:'#475569',
        fontWeight:700,fontSize:'10px',letterSpacing:'0.4px',
        textTransform:'uppercase',borderBottom:'2px solid #cbd5e1',
        textAlign:'left',
    },
    summaryThCenter: {
        padding:'5px 6px',backgroundColor:'#e2e8f0',color:'#475569',
        fontWeight:700,fontSize:'10px',letterSpacing:'0.4px',
        textTransform:'uppercase',borderBottom:'2px solid #cbd5e1',
        textAlign:'center',
    },
    summaryTd: {
        padding:'5px 6px',borderBottom:'1px solid #f1f5f9',
        color:'#334155',verticalAlign:'middle',
    },
    summaryTdCenter: {
        padding:'5px 6px',borderBottom:'1px solid #f1f5f9',
        color:'#334155',verticalAlign:'middle',textAlign:'center',
    },
    remainingZero: {
        fontWeight:700,color:'#dc2626',
    },
    remainingOk: {
        fontWeight:600,color:'#16a34a',
    },
    loadingSummary: {
        fontSize:'12px',color:'#64748b',textAlign:'center',padding:'16px 0',
    },
    // RIGHT PANEL
    rightPanel: {
        flex:1,display:'flex',flexDirection:'column',overflow:'hidden',
    },
    rightScroll: {
        flex:1,overflowY:'auto',padding:'20px 24px',
    },
    notice: {
        fontSize:'12.5px',color:'#92400e',backgroundColor:'#fffbeb',
        border:'1px solid #fde68a',borderRadius:'8px',
        padding:'10px 14px',marginBottom:'20px',lineHeight:'1.5',
    },
    tableWrap: {
        overflowX:'auto',marginBottom:'20px',borderRadius:'8px',
        border:'1px solid #e2e8f0',
    },
    table: {
        width:'100%',borderCollapse:'collapse',fontSize:'13px',
    },
    th: {
        padding:'10px 12px',backgroundColor:'#f1f5f9',
        color:'#475569',fontWeight:600,fontSize:'11.5px',
        letterSpacing:'0.4px',textTransform:'uppercase',
        borderBottom:'2px solid #e2e8f0',textAlign:'left',
        whiteSpace:'nowrap',
    },
    thCenter: {
        padding:'10px 12px',backgroundColor:'#f1f5f9',
        color:'#475569',fontWeight:600,fontSize:'11.5px',
        letterSpacing:'0.4px',textTransform:'uppercase',
        borderBottom:'2px solid #e2e8f0',textAlign:'center',
        whiteSpace:'nowrap',
    },
    td: {
        padding:'8px 10px',borderBottom:'1px solid #f1f5f9',
        verticalAlign:'middle',
    },
    tdCenter: {
        padding:'8px 10px',borderBottom:'1px solid #f1f5f9',
        verticalAlign:'middle',textAlign:'center',
    },
    input: (empty) => ({
        width:'100%',padding:'7px 10px',fontSize:'13px',
        border:`1.5px solid ${empty ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius:'6px',outline:'none',
        backgroundColor: empty ? '#fff5f5' : '#ffffff',
        transition:'border-color 0.15s, background 0.15s',
        boxSizing:'border-box',
    }),
    inputReadOnly: {
        width:'100%',padding:'7px 10px',fontSize:'13px',
        border:'1.5px solid #e2e8f0',borderRadius:'6px',
        backgroundColor:'#f8fafc',color:'#475569',boxSizing:'border-box',
    },
    select: (empty) => ({
        width:'100%',padding:'7px 10px',fontSize:'13px',
        border:`1.5px solid ${empty ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius:'6px',outline:'none',
        backgroundColor: empty ? '#fff5f5' : '#ffffff',
        cursor:'pointer',boxSizing:'border-box',
    }),
    staticCell: {
        fontSize:'13px',color:'#334155',padding:'0',
    },
    checkWrap: {
        display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
    },
    checkLabel: (yes) => ({
        fontSize:'11px',fontWeight:600,
        color: yes ? '#16a34a' : '#dc2626',
    }),
    actionBtnAdd: {
        padding:'5px 11px',backgroundColor:'#22c55e',color:'white',
        border:'none',borderRadius:'5px',cursor:'pointer',
        fontSize:'15px',fontWeight:700,lineHeight:1,marginRight:'4px',
    },
    actionBtnRemove: {
        padding:'5px 11px',backgroundColor:'#ef4444',color:'white',
        border:'none',borderRadius:'5px',cursor:'pointer',
        fontSize:'13px',fontWeight:700,lineHeight:1,
    },
    section: {
        backgroundColor:'#f8fafc',border:'1px solid #e2e8f0',
        borderRadius:'8px',padding:'16px 20px',marginBottom:'20px',
    },
    sectionTitle: {
        margin:'0 0 12px',fontSize:'13px',fontWeight:700,
        color:'#0f172a',
    },
    radioLabel: {
        display:'flex',alignItems:'center',gap:'8px',
        fontSize:'13px',color:'#334155',marginBottom:'8px',cursor:'pointer',
    },
    dateTimeRow: {
        display:'flex',gap:'16px',marginTop:'10px',marginLeft:'24px',flexWrap:'wrap',
    },
    dateTimeLabel: {
        fontSize:'12px',color:'#64748b',fontWeight:600,
        display:'flex',flexDirection:'column',gap:'4px',
    },
    dateInput: {
        padding:'6px 10px',border:'1.5px solid #e2e8f0',borderRadius:'6px',
        fontSize:'13px',outline:'none',
    },
    previewBox: {
        backgroundColor:'#f0fdf4',border:'1px solid #bbf7d0',
        borderRadius:'8px',padding:'14px 18px',marginBottom:'20px',
    },
    previewTitle: {
        margin:'0 0 8px',fontSize:'11px',fontWeight:700,
        color:'#16a34a',textTransform:'uppercase',letterSpacing:'0.6px',
    },
    previewText: {
        whiteSpace:'pre-wrap',margin:0,fontSize:'12.5px',
        color:'#166534',fontFamily:'\'Courier New\', monospace',lineHeight:'1.6',
    },
    footer: {
        padding:'14px 24px',borderTop:'1px solid #e2e8f0',
        display:'flex',gap:'10px',justifyContent:'flex-end',
        backgroundColor:'#f8fafc',flexShrink:0,
    },
    btnSubmit: (disabled) => ({
        padding:'10px 24px',backgroundColor: disabled ? '#93c5fd' : '#2563eb',
        color:'white',border:'none',borderRadius:'7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize:'13.5px',fontWeight:600,letterSpacing:'0.2px',
        display:'flex',alignItems:'center',gap:'8px',
    }),
    btnCancel: {
        padding:'10px 20px',backgroundColor:'white',color:'#475569',
        border:'1.5px solid #e2e8f0',borderRadius:'7px',cursor:'pointer',
        fontSize:'13.5px',fontWeight:600,
    },
    confirmOverlay: {
        position:'fixed',top:0,left:0,width:'100%',height:'100%',
        backgroundColor:'rgba(0,0,0,0.55)',display:'flex',
        justifyContent:'center',alignItems:'center',zIndex:2000,
    },
    confirmBox: {
        backgroundColor:'white',padding:'28px 32px',borderRadius:'12px',
        maxWidth:'480px',width:'90%',boxShadow:'0 20px 50px rgba(0,0,0,0.2)',
    },
    confirmTitle: {
        margin:'0 0 14px',fontSize:'16px',fontWeight:700,color:'#b45309',
        display:'flex',alignItems:'center',gap:'8px',
    },
    confirmMsg: {
        whiteSpace:'pre-wrap',fontSize:'13.5px',color:'#334155',
        lineHeight:'1.6',marginBottom:'20px',
    },
    confirmBtns: {
        display:'flex',gap:'10px',justifyContent:'flex-end',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

function TreatmentChatModal({ onClose, fileId, employeeName, token, useBatchAndExpiry, treatmentPlan }) {
    const showBatchExpiry = useBatchAndExpiry?.useBatch === 'yes' && useBatchAndExpiry?.useExpiry === 'yes';

    const isMounted    = useRef(true);
    const closeTimeout = useRef(null);

    const [rows, setRows]                       = useState([EMPTY_ROW(showBatchExpiry)]);
    const [drugSuggestions, setDrugSuggestions] = useState([]);
    const [nextDose, setNextDose]               = useState('');
    const [nextDoseDate, setNextDoseDate]       = useState('');
    const [nextDoseTime, setNextDoseTime]       = useState('');
    const [submitting, setSubmitting]           = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [confirmMsg, setConfirmMsg]           = useState('');
    const [preview, setPreview]                 = useState('');

    // ── NEW: treatment rows from fetchtreatmentrows2 ──────────────────────
    const [matchedSummary, setMatchedSummary]   = useState([]);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [initialFetchesComplete, setInitialFetchesComplete] = useState(false);

    // ── Lifecycle ──────────────────────────────────────────────────────────
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (closeTimeout.current) clearTimeout(closeTimeout.current);
            toast.dismiss();
        };
    }, []);

    // ── Fetch treatment rows & build matched summary ───────────────────────
    useEffect(() => {
        const fetchTreatmentRows = async () => {
            setIsSummaryLoading(true);
            try {
                const res = await fetch(urls.fetchtreatmentrows2, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileId }),
                });
                if (!res.ok) throw new Error('Failed to fetch treatment rows');
                const data = await res.json();
                if (isMounted.current) {
                    const plan = data.treatmentPlan || [];
                    const summary = matchTreatmentRowsToPrescription(plan, treatmentPlan);
                    setMatchedSummary(summary);
                }
            } catch (err) {
                console.error('fetchtreatmentrows2 error:', err);
                // Non-critical — silently fail, summary just stays empty
            } finally {
                if (isMounted.current) {
                    setIsSummaryLoading(false);
                }
            }
        };
        fetchTreatmentRows();
    }, [fileId, treatmentPlan]);

    // ── Fetch drug inventory ───────────────────────────────────────────────
    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const res = await fetch(urls.fetchdispensary2, {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ token }),
                });
                if (!res.ok) throw new Error('Fetch failed');
                const data = await res.json();
                if (isMounted.current) {
                    setDrugSuggestions(data);
                }
            } catch (err) {
                console.error(err);
                if (isMounted.current) toast.error('Failed to fetch drug inventory');
            }
        };
        
        const fetchPromises = [fetchDrugs()];
        
        // Wait for both fetches to complete (summary fetch is separate but we track its loading state)
        // We'll consider initial fetches complete when drug inventory fetch is done
        // and summary has finished loading (or errored)
        Promise.all(fetchPromises).finally(() => {
            if (isMounted.current) {
                // Wait a bit for summary to also be done or we'll just proceed
                // Use a small timeout to check if summary is still loading
                const checkFetchesComplete = () => {
                    if (!isSummaryLoading) {
                        setInitialFetchesComplete(true);
                    } else {
                        setTimeout(checkFetchesComplete, 100);
                    }
                };
                setTimeout(checkFetchesComplete, 100);
            }
        });
    }, [token, isSummaryLoading]);

    // ── Build preview sentence ─────────────────────────────────────────────
    useEffect(() => {
        const complete = rows.filter(r => r.drug && r.dosage && r.route && r.quantity !== '');
        const drugsList = complete.map(r => {
            let s = `${r.dosage} of ${r.drug} via ${r.route} (${r.quantity} ${r.packaging})`;
            if (showBatchExpiry) {
                s += ` [Batch: ${r.batch_number || 'No batch'}, Expiry: ${r.expiry_date || 'No expiry'}]`;
            }
            return s;
        }).join(', ');

        const now = new Date();
        const fDate = now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
        const fTime = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});

        let nextSentence = '';
        if (nextDose === 'File Closed') {
            nextSentence = 'File Closed';
        } else if (nextDose === 'On a specific date and time' && nextDoseDate && nextDoseTime) {
            const dt = new Date(`${nextDoseDate}T${nextDoseTime}`);
            if (!isNaN(dt.getTime())) {
                nextSentence = `on ${dt.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} at ${dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}`;
            }
        }

        setPreview(
            `Date: ${fDate} ${fTime}\n${employeeName} administered ${drugsList || '...'}.${nextSentence ? `\nNext dose is ${nextSentence}.` : ''}`
        );
    }, [rows, nextDose, nextDoseDate, nextDoseTime, employeeName, showBatchExpiry]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const isMedicalSupply = (name) =>
        MEDICAL_SUPPLY_KEYWORDS.some(k => name.toLowerCase().includes(k));

    const updateRow = useCallback((index, updates) => {
        setRows(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...updates };
            return copy;
        });
    }, []);

    const encodeOptionValue = (suggestion, idx) =>
        `${suggestion.Drug}||${suggestion.id || suggestion.drug_id + '_' + idx}`;

    const handleDrugChange = useCallback((index, rawValue) => {
        const separatorIdx = rawValue.lastIndexOf('||');
        if (separatorIdx !== -1) {
            const drugName    = rawValue.substring(0, separatorIdx);
            const inventoryKey = rawValue.substring(separatorIdx + 2);
            const match = drugSuggestions.find((s, idx) => {
                const key = String(s.id || s.drug_id + '_' + idx);
                return s.Drug === drugName && key === inventoryKey;
            });
            if (match) {
                updateRow(index, {
                    drug:                drugName,
                    packaging:           match.Packaging,
                    drug_id:             match.drug_id,
                    selectedInventoryId: match.id || null,
                    includeInChart:      !isMedicalSupply(drugName),
                    ...(showBatchExpiry ? {
                        batch_number: match.batch_number || 'No batch',
                        expiry_date:  match.expiry_date  || 'No expiry',
                    } : {}),
                });
                return;
            }
        }
        updateRow(index, {
            drug:                rawValue,
            packaging:           '',
            drug_id:             null,
            selectedInventoryId: null,
            includeInChart:      rawValue ? !isMedicalSupply(rawValue) : true,
            ...(showBatchExpiry ? {
                batch_number: 'No batch',
                expiry_date:  'No expiry',
            } : {}),
        });
    }, [updateRow, showBatchExpiry, drugSuggestions]);

    const addRow = () => {
        const last = rows[rows.length - 1];
        if (!last.drug || !last.dosage || !last.route || last.quantity === '') {
            toast.error('Please complete the current row before adding a new one.', { toastId:'add-row-err' });
            return;
        }
        setRows(prev => [...prev, EMPTY_ROW(showBatchExpiry)]);
    };

    const removeRow = (index) => {
        if (rows.length > 1) setRows(prev => prev.filter((_, i) => i !== index));
    };

    // ── Validation warnings ────────────────────────────────────────────────
    const getConfirmMessage = () => {
        const bottleDrugs = rows.filter(r => r.packaging?.toLowerCase().includes('bottle') && r.drug).map(r => r.drug);
        const hasBottles   = bottleDrugs.length > 0;
        const hasGivingSet = rows.some(r => r.drug?.toLowerCase().includes('giving set'));
        const hasIV        = rows.some(r => r.route === 'IV' && r.drug);
        const hasCannula   = rows.some(r => r.drug?.toLowerCase().includes('cannula'));

        const issues = [];
        if (hasBottles && !hasGivingSet)
            issues.push(`You administered ${bottleDrugs.join(', ')} (bottles) but no Giving Set was added.`);
        if (hasIV && !hasCannula)
            issues.push('IV route selected but no Cannula was added.');

        return issues.length
            ? `⚠️ Please confirm:\n\n${issues.map((v,i) => `${i+1}. ${v}`).join('\n')}\n\nAre you sure you want to continue?`
            : '';
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmitClick = () => {
        const msg = getConfirmMessage();
        if (msg) { setConfirmMsg(msg); setShowConfirm(true); }
        else      doSubmit();
    };

    const doSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setShowConfirm(false);

        if (!nextDose) {
            toast.error('Please select next dose option.', { toastId:'nd-err' });
            setSubmitting(false);
            return;
        }

        const complete = rows.filter(r => r.drug && r.dosage && r.route && r.quantity !== '');
        if (!complete.length) {
            toast.error('Please fill at least one complete drug row.', { toastId:'row-err' });
            setSubmitting(false);
            return;
        }

        toast.info(`Submitting, please wait…`, { toastId:'submit-info', autoClose:3000 });

        const payload = {
            fileId,
            treatment_plan: preview,
            employee_name:  employeeName,
            token,
            table_data: complete.map(r => ({
                drug:                   r.drug,
                packaging:              r.packaging,
                dosage:                 r.dosage,
                route:                  r.route,
                quantity:               r.quantity,
                includeInTreatmentChart: r.includeInChart ? 'yes' : 'no',
                ...(r.drug_id ? { drug_id: r.drug_id } : {}),
                ...(showBatchExpiry ? {
                    batch_number: r.batch_number || 'No batch',
                    expiry_date:  r.expiry_date  || 'No expiry',
                    ...(r.selectedInventoryId ? { inventory_id: r.selectedInventoryId } : {}),
                } : {}),
            })),
        };

        try {
            const res  = await fetch(urls.submitchat, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');

            if (data.success && isMounted.current) {
                toast.success('Treatment plan submitted!', { toastId:'ok' });
                try {
                    const ar  = await fetch(urls.assignAverage2, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
                    const ad  = await ar.json();
                    if (ad.success && isMounted.current)
                        toast.success('Average assigned!', { toastId:'avg-ok' });
                } catch (e) {
                    toast.error(`Average error: ${e.message}`, { autoClose:60000, toastId:'avg-err' });
                }
                closeTimeout.current = setTimeout(() => { if (isMounted.current) onClose(); }, 3000);
            }
        } catch (err) {
            if (isMounted.current)
                toast.error(`Error: ${err.message}`, { autoClose:60000, toastId:'submit-err' });
        } finally {
            if (isMounted.current) setSubmitting(false);
        }
    };

    // Don't render the summary table until all initial backend fetches have completed
    const renderSummaryTable = () => {
        if (!initialFetchesComplete) {
            return <div style={S.loadingSummary}>Loading dose tracker...</div>;
        }
        
        if (matchedSummary.length === 0) {
            return null;
        }
        
        return (
            <div style={S.summarySection}>
                <p style={S.summaryTitle}>📊 Dose Tracker</p>
                <table style={S.summaryTable}>
                    <thead>
                        <tr>
                            <th style={S.summaryTh}>Drug</th>
                            <th style={{...S.summaryThCenter}}>Total</th>
                            <th style={{...S.summaryThCenter}}>Given</th>
                            <th style={{...S.summaryThCenter}}>Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matchedSummary.map((item, idx) => (
                            <tr
                                key={idx}
                                style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                                title={`${item.drug_name} (${item.packaging})`}
                            >
                                <td style={S.summaryTd}>
                                    <div style={{ fontWeight:600, fontSize:'11px', color:'#0f172a', lineHeight:'1.3' }}>
                                        {item.drug_name.length > 18
                                            ? item.drug_name.substring(0, 17) + '…'
                                            : item.drug_name
                                        }
                                    </div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>
                                        {item.packaging}
                                    </div>
                                </td>
                                <td style={S.summaryTdCenter}>
                                    <span style={{ fontSize:'12px', fontWeight:600, color:'#334155' }}>
                                        {item.quantity}
                                    </span>
                                </td>
                                <td style={S.summaryTdCenter}>
                                    <span style={{
                                        fontSize:'12px', fontWeight:600,
                                        color: item.given_sofar > 0 ? '#2563eb' : '#94a3b8',
                                    }}>
                                        {item.given_sofar}
                                    </span>
                                </td>
                                <td style={S.summaryTdCenter}>
                                    <span style={item.remaining === 0 ? S.remainingZero : S.remainingOk}>
                                        {item.remaining}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div style={S.overlay}>
            <div style={S.modal}>

                {/* ── Confirmation sub-modal ── */}
                {showConfirm && (
                    <div style={S.confirmOverlay}>
                        <div style={S.confirmBox}>
                            <h3 style={S.confirmTitle}>⚠️ Confirmation Required</h3>
                            <p style={S.confirmMsg}>{confirmMsg}</p>
                            <div style={S.confirmBtns}>
                                <button style={S.btnCancel} onClick={() => setShowConfirm(false)}>Review</button>
                                <button style={S.btnSubmit(false)} onClick={doSubmit}>Yes, Proceed</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Header ── */}
                <div style={S.header}>
                    <h2 style={S.headerTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Treatment Chart
                        <span style={S.headerBadge}>{employeeName}</span>
                    </h2>
                    <button style={S.closeBtn} onClick={onClose} title="Close">✕</button>
                </div>

                <ToastContainer
                    containerId="tcm"
                    position="top-right"
                    autoClose={5000}
                    theme="light"
                    newestOnTop
                    style={{ top:'70px' }}
                />

                {/* ── Body ── */}
                <div style={S.body}>

                    {/* ── LEFT: Prescription + Summary ── */}
                    <aside style={S.leftPanel}>
                        <div style={S.leftPanelHeader}>
                            <p style={S.leftPanelTitle}>Prescription / Orders</p>
                        </div>
                        <div style={S.prescriptionBody}>

                            {/* Prescription text */}
                            {treatmentPlan
                                ? <pre style={S.prescriptionText}>{treatmentPlan}</pre>
                                : <p style={S.noPrescription}>No prescription provided.</p>
                            }

                            {/* ── Matched rows summary table (only shows after all fetches complete) ── */}
                            {renderSummaryTable()}

                        </div>
                    </aside>

                    {/* ── RIGHT: Form ── */}
                    <div style={S.rightPanel}>
                        <div style={S.rightScroll}>

                            <p style={S.notice}>
                                📋 Please record <strong>everything</strong> administered to this patient — including syringes, cannulas, and giving sets — to ensure accurate billing and inventory calculations.
                            </p>

                            {/* ── Table ── */}
                            <div style={S.tableWrap}>
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            <th style={{...S.th, width:'22%'}}>Drug Name</th>
                                            <th style={{...S.th, width:'10%'}}>Packaging</th>
                                            <th style={{...S.th, width:'12%'}}>Dosage</th>
                                            <th style={{...S.th, width:'10%'}}>Route</th>
                                            <th style={{...S.th, width:'7%'}}>Qty</th>
                                            {showBatchExpiry && <>
                                                <th style={{...S.th, width:'11%'}}>Batch No.</th>
                                                <th style={{...S.th, width:'11%'}}>Expiry</th>
                                            </>}
                                            <th style={{...S.thCenter, width:'9%'}}>In Chart</th>
                                            <th style={{...S.thCenter, width:'7%'}}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>

                                                {/* Drug name */}
                                                <td style={S.td}>
                                                    <input
                                                        list={`drug-list-${i}`}
                                                        type="text"
                                                        value={row.drug}
                                                        onChange={e => handleDrugChange(i, e.target.value)}
                                                        placeholder="Type to search…"
                                                        autoComplete="off"
                                                        style={S.input(!row.drug)}
                                                    />
                                                    <datalist id={`drug-list-${i}`}>
                                                        {drugSuggestions.map((s, si) => {
                                                            const expiry = s.expiry_date  || 'No expiry';
                                                            const batch  = s.batch_number || 'No batch';
                                                            const label  = [
                                                                s.Packaging,
                                                                `Qty: ${s.Quantity}`,
                                                                showBatchExpiry ? `Batch: ${batch}` : null,
                                                                showBatchExpiry ? `Exp: ${expiry}`  : null,
                                                            ].filter(Boolean).join('  |  ');
                                                            return (
                                                                <option
                                                                    key={`${s.drug_id}-${si}`}
                                                                    value={encodeOptionValue(s, si)}
                                                                    label={label}
                                                                />
                                                            );
                                                        })}
                                                    </datalist>
                                                </td>

                                                {/* Packaging (auto-filled, read-only) */}
                                                <td style={S.td}>
                                                    <span style={S.staticCell}>{row.packaging || <span style={{color:'#cbd5e1'}}>—</span>}</span>
                                                </td>

                                                {/* Dosage */}
                                                <td style={S.td}>
                                                    <input
                                                        type="text"
                                                        value={row.dosage}
                                                        onChange={e => updateRow(i, { dosage: e.target.value })}
                                                        placeholder="e.g. 500mg"
                                                        style={S.input(!row.dosage)}
                                                    />
                                                </td>

                                                {/* Route */}
                                                <td style={S.td}>
                                                    <select
                                                        value={row.route}
                                                        onChange={e => updateRow(i, { route: e.target.value })}
                                                        style={S.select(!row.route)}
                                                    >
                                                        <option value="">Select…</option>
                                                        {ROUTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </td>

                                                {/* Quantity */}
                                                <td style={S.td}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={row.quantity}
                                                        onChange={e => updateRow(i, { quantity: parseInt(e.target.value, 10) || '' })}
                                                        style={S.input(row.quantity === '' || row.quantity === 0)}
                                                        placeholder="0"
                                                    />
                                                </td>

                                                {/* Batch & Expiry (conditional) */}
                                                {showBatchExpiry && <>
                                                    <td style={S.td}>
                                                        <div style={{
                                                            padding:'7px 10px', fontSize:'13px',
                                                            border:'1.5px solid #e2e8f0', borderRadius:'6px',
                                                            backgroundColor:'#f8fafc',
                                                            color: row.batch_number && row.batch_number !== 'No batch' ? '#0f172a' : '#94a3b8',
                                                            fontStyle: (!row.batch_number || row.batch_number === 'No batch') ? 'italic' : 'normal',
                                                            minHeight:'34px', display:'flex', alignItems:'center',
                                                        }}>
                                                            {row.batch_number || 'No batch'}
                                                        </div>
                                                    </td>
                                                    <td style={S.td}>
                                                        <div style={{
                                                            padding:'7px 10px', fontSize:'13px',
                                                            border:`1.5px solid ${
                                                                row.expiry_date && row.expiry_date !== 'No expiry' && new Date(row.expiry_date) < new Date()
                                                                    ? '#fca5a5' : '#e2e8f0'
                                                            }`,
                                                            borderRadius:'6px',
                                                            backgroundColor: row.expiry_date && row.expiry_date !== 'No expiry' && new Date(row.expiry_date) < new Date()
                                                                ? '#fff5f5' : '#f8fafc',
                                                            color: (!row.expiry_date || row.expiry_date === 'No expiry')
                                                                ? '#94a3b8'
                                                                : new Date(row.expiry_date) < new Date()
                                                                    ? '#dc2626' : '#0f172a',
                                                            fontStyle: (!row.expiry_date || row.expiry_date === 'No expiry') ? 'italic' : 'normal',
                                                            fontWeight: row.expiry_date && row.expiry_date !== 'No expiry' && new Date(row.expiry_date) < new Date() ? 600 : 400,
                                                            minHeight:'34px', display:'flex', alignItems:'center',
                                                        }}>
                                                            {row.expiry_date && row.expiry_date !== 'No expiry' && new Date(row.expiry_date) < new Date()
                                                                ? `⚠ EXPIRED: ${row.expiry_date}`
                                                                : (row.expiry_date || 'No expiry')
                                                            }
                                                        </div>
                                                    </td>
                                                </>}

                                                {/* Include in chart */}
                                                <td style={S.tdCenter}>
                                                    <div style={S.checkWrap}>
                                                        <input
                                                            type="checkbox"
                                                            checked={row.includeInChart}
                                                            onChange={() => updateRow(i, { includeInChart: !row.includeInChart })}
                                                            style={{ cursor:'pointer', width:'15px', height:'15px' }}
                                                        />
                                                        <span style={S.checkLabel(row.includeInChart)}>
                                                            {row.includeInChart ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td style={S.tdCenter}>
                                                    <button
                                                        onClick={addRow}
                                                        disabled={rows.length >= 10}
                                                        style={S.actionBtnAdd}
                                                        title="Add row"
                                                    >+</button>
                                                    <button
                                                        onClick={() => removeRow(i)}
                                                        disabled={rows.length === 1}
                                                        style={S.actionBtnRemove}
                                                        title="Remove row"
                                                    >✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Next dose ── */}
                            <div style={S.section}>
                                <h4 style={S.sectionTitle}>Next Dose / File Status</h4>
                                <label style={S.radioLabel}>
                                    <input type="radio" name="nd" value="On a specific date and time"
                                        checked={nextDose === 'On a specific date and time'}
                                        onChange={() => setNextDose('On a specific date and time')}
                                    />
                                    Schedule next dose on a specific date & time
                                </label>
                                {nextDose === 'On a specific date and time' && (
                                    <div style={S.dateTimeRow}>
                                        <label style={S.dateTimeLabel}>
                                            Date
                                            <input type="date" value={nextDoseDate} onChange={e => setNextDoseDate(e.target.value)} style={S.dateInput} />
                                        </label>
                                        <label style={S.dateTimeLabel}>
                                            Time
                                            <input type="time" value={nextDoseTime} onChange={e => setNextDoseTime(e.target.value)} style={S.dateInput} />
                                        </label>
                                    </div>
                                )}
                                <label style={S.radioLabel}>
                                    <input type="radio" name="nd" value="File Closed"
                                        checked={nextDose === 'File Closed'}
                                        onChange={() => setNextDose('File Closed')}
                                    />
                                    File Closed
                                </label>
                            </div>

                            {/* ── Preview ── */}
                            <div style={S.previewBox}>
                                <p style={S.previewTitle}>📝 Chart Preview</p>
                                <pre style={S.previewText}>{preview}</pre>
                            </div>

                        </div>{/* end rightScroll */}

                        {/* ── Footer ── */}
                        <div style={S.footer}>
                            <button style={S.btnCancel} onClick={onClose} disabled={submitting}>Cancel</button>
                            <button style={S.btnSubmit(submitting)} onClick={handleSubmitClick} disabled={submitting}>
                                {submitting
                                    ? <><span style={{display:'inline-block',width:'14px',height:'14px',border:'2px solid white',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>Submitting…</>
                                    : '✓ Submit Chart'
                                }
                            </button>
                        </div>
                    </div>{/* end rightPanel */}
                </div>{/* end body */}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default TreatmentChatModal;