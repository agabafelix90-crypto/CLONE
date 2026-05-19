import React, { useState, useRef, useEffect } from 'react';
import { urls } from './config.dev';
import { toast } from 'react-toastify';
import SuccessDialog from './SuccessDialog';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// ─── Main Component ────────────────────────────────────────────────────────
function TestResultModal({
  patient,
  clinicDetails,
  token,
  onClose,
  onSubmit,
  totalLabTests,
  testsToBeDone = [],
  useDrugExpiryDate = 'no',
  useDrugBatchNumbers = 'no',
}) {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [estimatedPages, setEstimatedPages] = useState(1);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  // Step flow: 'editor' → 'drugs' → 'confirm'
  const [step, setStep] = useState('editor');

  // Dispensary state
  const [drugs, setDrugs] = useState([]);
  const [drugsLoading, setDrugsLoading] = useState(false);

  // Drug rows for the new table UI
  // Each row: { id, drug_id, drugName, packaging, quantity_available, selling_price, quantity, batch_number, expiry_date, isValid, quantityEntered }
  const [drugRows, setDrugRows] = useState([
    { id: Date.now(), drug_id: null, drugName: '', packaging: '', quantity_available: 0, selling_price: 0, quantity: '', batch_number: '', expiry_date: '', isValid: false, quantityEntered: false },
  ]);

  const editorRef = useRef(null);
  const AVG_CHARS_PER_LINE = 80;
  const LINES_PER_PAGE = 25;
  const CHARS_PER_PAGE = AVG_CHARS_PER_LINE * LINES_PER_PAGE;

  const showExpiry = useDrugExpiryDate === 'yes';
  const showBatch = useDrugBatchNumbers === 'yes';

  const extractTests = (labTests) => {
    if (!labTests) return [];
    return labTests.replace(/Lab Test:\s*/g, '').split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
  };
  const formatLabTests = (tests) => (tests ? tests.replace(/Lab Test:\s*/g, '') : '');

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kampala',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(now);
    const initial = `Date: ${formattedDate}\n\n`;
    const { contentBlocks, entityMap } = htmlToDraft(initial);
    setEditorState(EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks, entityMap)));
    fetchTemplates();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updatePageEstimate = (content) => {
    const chars = content.replace(/<[^>]*>/g, '').length;
    setEstimatedPages(Math.ceil(chars / CHARS_PER_PAGE) || 1);
  };

  const onEditorStateChange = (s) => {
    setEditorState(s);
    updatePageEstimate(draftToHtml(convertToRaw(s.getCurrentContent())));
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch(urls.fetchLabTemplates, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.status === 'success') setTemplates(data.data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    const { contentBlocks, entityMap } = htmlToDraft(template.report);
    const tpl = ContentState.createFromBlockArray(contentBlocks, entityMap);
    const current = editorState.getCurrentContent();
    const merged = current.merge({ blockMap: current.getBlockMap().merge(tpl.getBlockMap()) });
    setEditorState(EditorState.push(editorState, merged, 'insert-fragment'));
  };

  // ── Dispensary ────────────────────────────────────────────────────────────
  const fetchDrugs = async () => {
    setDrugsLoading(true);
    try {
      const res = await fetch(urls.fetchdispensary2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setDrugs(list.map((d) => ({
        ...d,
        expiry_date: d.expiry_date || null,
        batch_number: d.batch_number || null,
      })));
    } catch {
      toast.error('Failed to load dispensary');
    } finally {
      setDrugsLoading(false);
    }
  };

  const handleContinueToStep2 = () => {
    setStep('drugs');
    if (drugs.length === 0) fetchDrugs();
  };

  // ── Drug Row Management ───────────────────────────────────────────────────
  const addDrugRow = () => {
    setDrugRows((prev) => [
      ...prev,
      { id: Date.now(), drug_id: null, drugName: '', packaging: '', quantity_available: 0, selling_price: 0, quantity: '', batch_number: '', expiry_date: '', isValid: false, quantityEntered: false },
    ]);
  };

  const removeDrugRow = (rowId) => {
    setDrugRows((prev) => {
      if (prev.length === 1) {
        // Reset the first row instead of removing
        return [{ id: Date.now(), drug_id: null, drugName: '', packaging: '', quantity_available: 0, selling_price: 0, quantity: '', batch_number: '', expiry_date: '', isValid: false, quantityEntered: false }];
      }
      return prev.filter((r) => r.id !== rowId);
    });
  };

  const updateRow = (rowId, fields) => {
    setDrugRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...fields } : r)));
  };

  // Handle drug selection from datalist
  const handleDrugSelect = (rowId, drugName) => {
    const selectedDrug = drugs.find(
      (d) => d.Drug === drugName
    );
    
    if (selectedDrug) {
      updateRow(rowId, {
        drug_id: selectedDrug.drug_id,
        drugName: selectedDrug.Drug,
        packaging: selectedDrug.Packaging,
        quantity_available: selectedDrug.Quantity,
        selling_price: selectedDrug.Selling_Price,
        batch_number: selectedDrug.batch_number || '',
        expiry_date: selectedDrug.expiry_date || '',
        quantity: '',
        isValid: false,
        quantityEntered: false,
      });
    } else {
      updateRow(rowId, { drugName: drugName, drug_id: null });
    }
  };

  const handleQuantityChange = (rowId, value, maxQty) => {
    if (value === '') { 
      updateRow(rowId, { quantity: '', isValid: false, quantityEntered: false }); 
      return; 
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 1) { 
      updateRow(rowId, { quantity: '', isValid: false, quantityEntered: false }); 
      return; 
    }
    if (num > maxQty) {
      toast.warning(`Cannot exceed available quantity of ${maxQty}`);
      updateRow(rowId, { quantity: String(maxQty), isValid: true, quantityEntered: true });
      return;
    }
    updateRow(rowId, { quantity: String(num), isValid: true, quantityEntered: true });
  };

  // Check if a row can have the add button (quantity entered)
  const canAddNewRow = () => {
    // Check if all rows that have a drug selected also have quantity entered
    return drugRows.every(row => {
      if (row.drug_id) {
        return row.quantityEntered === true;
      }
      return true;
    });
  };

  // Attached drugs (rows that have a valid drug and quantity)
  const attachedDrugs = drugRows.filter((r) => r.drug_id && r.quantity && parseInt(r.quantity) > 0);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      const rawContent = convertToRaw(editorState.getCurrentContent());

      const drugsUsed = attachedDrugs.map((r) => ({
        drug_id: r.drug_id,
        Drug: r.drugName,
        Packaging: r.packaging,
        Quantity: parseInt(r.quantity),
        Selling_Price: r.selling_price,
        batch_number: showBatch ? (r.batch_number || null) : null,
        expiry_date: showExpiry ? (r.expiry_date || null) : null,
      }));

      const res = await fetch(urls.submitlabresults2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: patient.file_id,
          contact_id: patient.contact_id,
          results: htmlContent,
          raw_results: rawContent,
          totalLabTests,
          drugs_used: drugsUsed,
          token,
        }),
      });

      if (res.ok) {
        onSubmit();
        setStep('editor');
        setSuccess(true);
      } else {
        throw new Error();
      }
    } catch {
      setError('Failed to submit results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintConfirmation = async (shouldPrint) => {
    if (!shouldPrint) { onClose(); return; }
    setPrinting(true);
    try {
      await handlePrint();
      setPrintSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      setError('Failed to generate PDF. Results were saved.');
    } finally {
      setPrinting(false);
    }
  };

  const handlePrint = async () => {
    const plainText = editorState.getCurrentContent().getPlainText();
    const printData = {
      clinicName: clinicDetails?.clinic_name || '',
      contact: clinicDetails?.owners_contact || '',
      location: `${clinicDetails?.sub_county || ''}, ${clinicDetails?.district || ''}`,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientAge: patient.age,
      patientSex: patient.sex,
      laboratoryTests: formatLabTests(patient.lab_tests),
      laboratoryResults: plainText.trim().split('\n').map((r) => r.trim()),
      htmlContent: draftToHtml(convertToRaw(editorState.getCurrentContent())),
    };
    const res = await fetch(urls.pdflab2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printData),
    });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    window.open(window.URL.createObjectURL(blob), '_blank');
    toast.success('PDF generated successfully!');
  };

  // Format display suggestion for datalist
  const getDrugDisplayString = (drug) => {
    let display = `${drug.Drug} | ${drug.Packaging} | Stock: ${drug.Quantity}`;
    
    // Handle batch number display
    if (showBatch) {
      const hasBatch = drug.batch_number && drug.batch_number !== 'null' && drug.batch_number !== 'NULL' && drug.batch_number.trim() !== '';
      display += ` | Batch: ${hasBatch ? drug.batch_number : 'No batch'}`;
    }
    
    // Handle expiry date display
    if (showExpiry) {
      const hasExpiry = drug.expiry_date && drug.expiry_date !== 'null' && drug.expiry_date !== 'NULL' && drug.expiry_date.trim() !== '';
      display += ` | Exp: ${hasExpiry ? drug.expiry_date : 'No expiry'}`;
    }
   
    return display;
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    modal: {
      background: '#ffffff',
      width: '95%', maxWidth: '1400px',
      height: '90vh', maxHeight: '90vh',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '16px 24px',
      borderBottom: '1px solid #e9ecef',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, background: '#ffffff',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    headerTitle: { fontSize: '18px', fontWeight: '600', color: '#212529' },
    headerSub: { fontSize: '13px', color: '#6c757d', marginTop: '2px' },
    closeBtn: {
      background: 'transparent', border: 'none',
      color: '#6c757d', borderRadius: '6px', width: '32px', height: '32px',
      cursor: 'pointer', fontSize: '18px', display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
    },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    leftPanel: {
      width: '280px', minWidth: '280px',
      borderRight: '1px solid #e9ecef',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#f8f9fa',
    },
    panelSection: { padding: '16px', borderBottom: '1px solid #e9ecef' },
    pillBtn: {
      display: 'flex', alignItems: 'center', gap: '8px',
      background: '#ffffff', color: '#495057',
      border: '1px solid #dee2e6', borderRadius: '8px',
      padding: '8px 12px', fontSize: '13px', fontWeight: '500',
      cursor: 'pointer', width: '100%', justifyContent: 'flex-start',
      fontFamily: 'inherit', transition: 'all 0.2s',
    },
    patientCard: {
      marginTop: '12px', background: '#ffffff', borderRadius: '8px',
      border: '1px solid #e9ecef', overflow: 'hidden',
    },
    patientRow: {
      display: 'flex', gap: '8px',
      padding: '8px 12px', borderBottom: '1px solid #f1f3f5',
      fontSize: '13px', alignItems: 'flex-start',
    },
    patientLabel: { fontWeight: '600', color: '#6c757d', minWidth: '50px', flexShrink: 0 },
    patientVal: { color: '#212529', wordBreak: 'break-word' },
    sectionLabel: {
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
      textTransform: 'uppercase', color: '#adb5bd', marginBottom: '12px',
    },
    templateList: {
      flex: 1, overflowY: 'auto',
      border: '1px solid #e9ecef', borderRadius: '8px', background: '#ffffff',
    },
    templateItem: {
      padding: '10px 12px', borderBottom: '1px solid #f1f3f5',
      cursor: 'pointer', fontSize: '13px', color: '#495057',
      display: 'flex', alignItems: 'center', gap: '8px',
      transition: 'background 0.2s', fontFamily: 'inherit',
    },
    loadingMsg: { padding: '20px', textAlign: 'center', color: '#adb5bd', fontSize: '13px' },
    rightPanel: {
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff',
    },
    editorHeader: {
      padding: '12px 20px', borderBottom: '1px solid #e9ecef',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
   
   
      background: '#ffffff', flexShrink: 0,
    },
    editorTitle: { fontSize: '14px', fontWeight: '600', color: '#495057' },
    pageHint: { fontSize: '12px', color: '#adb5bd' },
    editorWrap: {
      flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      margin: '16px 20px', border: '1px solid #e9ecef', borderRadius: '8px', background: '#ffffff',
    },
    toolbar: {
      background: '#f8f9fa', border: 'none',
      borderBottom: '1px solid #e9ecef', margin: 0, padding: '6px 10px',
    },
    editorInner: {
      flex: 1, minHeight: '300px', overflowY: 'auto', padding: '16px',
      fontSize: '14px', lineHeight: '1.6', color: '#212529',
    },
    footer: {
      padding: '16px 24px', borderTop: '1px solid #e9ecef',
      display: 'flex', alignItems: 'center', background: '#ffffff', flexShrink: 0,
    },
    errorMsg: { fontSize: '13px', color: '#dc3545', flex: 1 },
    btnSecondary: {
      padding: '8px 16px', border: '1px solid #dee2e6', borderRadius: '6px',
      cursor: 'pointer', background: '#ffffff', color: '#495057',
      fontSize: '13px', fontWeight: '500', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    btnPrimary: {
      padding: '9px 22px', border: 'none', borderRadius: '6px',
      cursor: 'pointer', background: '#0d6efd', color: '#ffffff',
      fontSize: '13px', fontWeight: '600', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
    },
    subOverlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1010, padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    subModal: {
      background: '#ffffff', width: '95%',
      borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    subHeader: {
      padding: '16px 24px', borderBottom: '1px solid #e9ecef',
      background: '#ffffff', fontSize: '16px', fontWeight: '600', color: '#212529',
      display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
    },
    subFooter: {
      padding: '16px 24px', borderTop: '1px solid #e9ecef',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#f8f9fa', flexShrink: 0, gap: '12px',
    },
    warningBox: {
      background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px',
      padding: '12px 16px', fontSize: '13px', color: '#856404', lineHeight: '1.5',
      display: 'flex', gap: '10px', alignItems: 'flex-start',
    },
    spinner: {
      display: 'inline-block', width: '14px', height: '14px',
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    },
    spinnerDark: {
      display: 'inline-block', width: '24px', height: '24px',
      border: '3px solid rgba(13,110,253,0.2)', borderTopColor: '#0d6efd',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    confirmModal: {
      background: '#ffffff', width: '95%', maxWidth: '560px',
      borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
    },
    confirmRow: {
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 24px', borderBottom: '1px solid #f1f3f5', fontSize: '13px',
    },
    confirmLabel: { fontWeight: '600', color: '#6c757d', minWidth: '130px', flexShrink: 0 },
    confirmVal: { color: '#212529', flex: 1 },
    confirmValRed: { color: '#dc3545', fontWeight: '500', flex: 1 },
    confirmValMuted: { color: '#0d6efd', fontWeight: '500', flex: 1, fontStyle: 'italic' },
  };

  // ── Drug Table Styles (Updated with square buttons and reduced drug name width) ──
  const DT = {
    wrapper: { padding: '20px 24px', flex: 1, overflowY: 'auto' },
    tableWrap: { border: '1px solid #e9ecef', borderRadius: '10px', overflow: 'visible', background: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
    thead: { background: '#f8f9fa' },
    th: {
      padding: '11px 14px', fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6c757d',
      borderBottom: '2px solid #e9ecef', textAlign: 'left',
    },
    thCenter: {
      padding: '11px 14px', fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6c757d',
      borderBottom: '2px solid #e9ecef', textAlign: 'center',
    },
    td: {
      padding: '10px 14px', borderBottom: '1px solid #f1f3f5',
      verticalAlign: 'middle', position: 'relative',
    },
    tdCenter: {
      padding: '10px 14px', borderBottom: '1px solid #f1f3f5',
      verticalAlign: 'middle', textAlign: 'center',
    },
    drugNameInput: {
      width: '100%', padding: '7px 10px',
      border: '1px solid #dee2e6',
      borderRadius: '6px', fontSize: '13px', color: '#212529',
      fontFamily: 'inherit', outline: 'none', background: '#ffffff',
      boxSizing: 'border-box',
    },
    packagingBadge: {
      background: '#e7f1ff', color: '#004085', border: '1px solid #b8daff',
      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '500',
      display: 'inline-block', whiteSpace: 'nowrap',
    },
    placeholderText: { color: '#adb5bd', fontSize: '12px', fontStyle: 'italic' },
    qtyInput: (filled) => ({
      width: '80px', padding: '7px 10px',
      border: `1.5px solid ${filled ? '#28a745' : '#dc3545'}`,
      borderRadius: '6px', fontSize: '13px', textAlign: 'center', color: '#212529',
      fontFamily: 'inherit', outline: 'none', background: filled ? '#f0fff4' : '#fff5f5',
      transition: 'border-color 0.2s, background 0.2s',
    }),
    qtyHint: { fontSize: '10px', color: '#6c757d', marginTop: '2px', textAlign: 'center' },
    textInput: {
      width: '100%', padding: '7px 10px', border: '1px solid #dee2e6',
      borderRadius: '6px', fontSize: '12px', color: '#212529',
      fontFamily: 'inherit', outline: 'none', background: '#ffffff',
      boxSizing: 'border-box',
    },
    dateInput: {
      width: '100%', padding: '7px 10px', border: '1px solid #dee2e6',
      borderRadius: '6px', fontSize: '12px', color: '#212529',
      fontFamily: 'inherit', outline: 'none', background: '#ffffff',
      boxSizing: 'border-box',
    },
    nullText: { color: '#adb5bd', fontSize: '11px', fontStyle: 'italic' },
    // Square button styles
    addBtn: (disabled) => ({
      width: '32px', height: '32px',
      border: 'none', background: disabled ? '#6c757d' : '#28a745',
      color: '#ffffff', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '18px', fontWeight: '700',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', flexShrink: 0, lineHeight: 1,
      opacity: disabled ? 0.5 : 1,
      borderRadius: '6px',
    }),
    deleteBtn: {
      width: '32px', height: '32px',
      border: '1px solid #dc3545', background: '#ffffff',
      color: '#dc3545', cursor: 'pointer', fontSize: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', flexShrink: 0,
      borderRadius: '6px',
    },
    actionCell: {
      padding: '10px 14px', borderBottom: '1px solid #f1f3f5',
      verticalAlign: 'middle', textAlign: 'center', width: '90px',
    },
    actionBtns: { display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' },
    summaryBar: {
      padding: '10px 24px', background: '#f0fdf4', borderTop: '1px solid #c3e6cb',
      display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flexShrink: 0,
    },
    drugChip: {
      background: '#ffffff', color: '#155724', border: '1px solid #c3e6cb',
      borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '500',
    },
  };

  // Add column width definitions for better space management
  const columnWidths = {
    drugName: '28%',
    packaging: '15%',
    batch: '18%',
    expiry: '18%',
    quantity: '12%',
    action: '9%',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Main Editor Modal ── */}
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={S.header}>
            <div style={S.headerLeft}>
              <span style={{ fontSize: '22px' }}>🔬</span>
              <div>
                <div style={S.headerTitle}>Lab Results · {patient.first_name} {patient.last_name}</div>
                <div style={S.headerSub}>{formatLabTests(patient.lab_tests)}</div>
              </div>
            </div>
            <button style={S.closeBtn} onClick={onClose}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>✕</button>
          </div>

          <div style={S.body}>
            {/* Left Panel */}
            <div style={S.leftPanel}>
              <div style={S.panelSection}>
                <button style={S.pillBtn} onClick={() => setShowPatientDetails((v) => !v)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}>
                  <span style={{ fontSize: '10px' }}>{showPatientDetails ? '▼' : '▶'}</span>
                  <span>👤</span> Patient Details
                </button>
                {showPatientDetails && (
                  <div style={S.patientCard}>
                    {[
                      ['Name', `${patient.first_name} ${patient.last_name}`],
                      ['Age', patient.age],
                      ['Sex', patient.sex],
                      ['File ID', patient.file_id],
                      ['Tests', formatLabTests(patient.lab_tests)],
                    ].map(([label, val]) => (
                      <div key={label} style={S.patientRow}>
                        <span style={S.patientLabel}>{label}</span>
                        <span style={S.patientVal}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ ...S.panelSection, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={S.sectionLabel}>Test Templates</div>
                <div style={S.templateList}>
                  {templatesLoading ? (
                    <div style={S.loadingMsg}>Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <div style={S.loadingMsg}>No templates found</div>
                  ) : (
                    templates.map((t, i) => (
                      <div key={t.id}
                        style={{ ...S.templateItem, background: i % 2 === 0 ? '#ffffff' : '#f8f9fa' }}
                        onClick={() => handleTemplateSelect(t)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa')}>
                        <span>📄</span>{t.report_name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Editor */}
            <div style={S.rightPanel}>
              <div style={S.editorHeader}>
                <span style={S.editorTitle}>Results Entry</span>
                <span style={S.pageHint}>~{estimatedPages} page{estimatedPages !== 1 ? 's' : ''}</span>
              </div>
              <div style={S.editorWrap}>
                <Editor
                  editorRef={(r) => (editorRef.current = r)}
                  editorState={editorState}
                  onEditorStateChange={onEditorStateChange}
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'history'],
                    inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
                    blockType: { options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote'] },
                    fontSize: { options: [10, 12, 14, 16, 18, 24] },
                  }}
                  placeholder="Write lab findings here..."
                  wrapperStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  toolbarStyle={S.toolbar}
                  editorStyle={S.editorInner}
                />
              </div>
            </div>
          </div>

          <div style={S.footer}>
            {error && <div style={S.errorMsg}>{error}</div>}
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
              <button style={S.btnSecondary} onClick={onClose}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleContinueToStep2}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0b5ed7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d6efd')}>
                Continue <span style={{ fontSize: '14px' }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 2: Drug Attachment Modal ── */}
      {step === 'drugs' && (
        <div style={S.subOverlay}>
          <div style={{ ...S.subModal, maxWidth: showBatch || showExpiry ? '1200px' : '900px' }}>
            <div style={S.subHeader}>
              <span>💊</span>
              <span>Attach Drugs Used</span>
              <button style={{ ...S.closeBtn, marginLeft: 'auto' }} onClick={() => setStep('editor')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>✕</button>
            </div>

            {/* Warning */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
              <div style={S.warningBox}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                <span>
                  <strong>Important:</strong> Do not attach drugs already recorded in the <em>Drug Removal / Taken Drugs</em> module.
                  Attaching them again here will create <strong>duplicate records</strong>.
                </span>
              </div>
            </div>

            {/* Drug Table */}
            {drugsLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '40px' }}>
                <div style={S.spinnerDark} />
                <div style={{ fontSize: '13px', color: '#adb5bd' }}>Loading dispensary...</div>
              </div>
            ) : (
              <div style={DT.wrapper}>
                <div style={DT.tableWrap}>
                  <table style={DT.table}>
                    <thead style={DT.thead}>
                      <tr>
                        <th style={{ ...DT.th, width: columnWidths.drugName }}>Drug Name</th>
                        <th style={{ ...DT.th, width: columnWidths.packaging }}>Packaging</th>
                        {(showBatch || showExpiry) && (
                          <>
                            {showBatch && <th style={{ ...DT.th, width: columnWidths.batch }}>Batch No.</th>}
                            {showExpiry && <th style={{ ...DT.th, width: columnWidths.expiry }}>Expiry Date</th>}
                          </>
                        )}
                        <th style={{ ...DT.thCenter, width: columnWidths.quantity }}>Qty Used</th>
                        <th style={{ ...DT.thCenter, width: columnWidths.action }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugRows.map((row, idx) => {
                        const qtyFilled = row.quantity && parseInt(row.quantity) > 0;
                        const isAddButtonDisabled = !canAddNewRow();
                        const showAddButton = idx === drugRows.length - 1;

                        return (
                          <tr key={row.id}
                            style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>

                            {/* Drug Name Cell with Native Datalist */}
                            <td style={DT.td}>
                              <input
                                list={`drug-suggestions-${row.id}`}
                                type="text"
                                placeholder="Type to search drugs..."
                                value={row.drugName}
                                onChange={(e) => handleDrugSelect(row.id, e.target.value)}
                                style={DT.drugNameInput}
                                autoComplete="off"
                              />
                              <datalist id={`drug-suggestions-${row.id}`}>
                                {drugs.map((drug) => (
                                  <option key={drug.drug_id} value={drug.Drug}>
                                    {getDrugDisplayString(drug)}
                                  </option>
                                ))}
                              </datalist>
                            </td>

                            {/* Packaging */}
                            <td style={DT.td}>
                              <div>
                                {row.packaging
                                  ? <span style={DT.packagingBadge}>{row.packaging}</span>
                                  : <span style={DT.placeholderText}>—</span>}
                              </div>
                            </td>

                            {/* Batch No. (conditional) */}
                            {showBatch && (
                              <td style={DT.td}>
                                {row.drug_id ? (
                                  row.batch_number ? (
                                    <input
                                      type="text"
                                      value={row.batch_number}
                                      onChange={(e) => updateRow(row.id, { batch_number: e.target.value })}
                                      style={{ ...DT.textInput, minWidth: '120px' }}
                                      placeholder="Batch No."
                                    />
                                  ) : (
                                    <span style={DT.nullText}>No batch</span>
                                  )
                                ) : (
                                  <span style={DT.placeholderText}>—</span>
                                )}
                              </td>
                            )}

                            {/* Expiry Date (conditional) */}
                            {showExpiry && (
                              <td style={DT.td}>
                                {row.drug_id ? (
                                  row.expiry_date ? (
                                    <input
                                      type="date"
                                      value={row.expiry_date}
                                      onChange={(e) => updateRow(row.id, { expiry_date: e.target.value })}
                                      style={{ ...DT.dateInput, minWidth: '140px' }}
                                    />
                                  ) : (
                                    <span style={DT.nullText}>No expiry</span>
                                  )
                                ) : (
                                  <span style={DT.placeholderText}>—</span>
                                )}
                              </td>
                            )}

                            {/* Quantity Used */}
                            <td style={DT.tdCenter}>
                              {row.drug_id ? (
                                <div>
                                  <input
                                    type="number"
                                    min={1}
                                    max={row.quantity_available}
                                    value={row.quantity}
                                    placeholder="Qty"
                                    onChange={(e) => handleQuantityChange(row.id, e.target.value, row.quantity_available)}
                                    style={DT.qtyInput(qtyFilled)}
                                  />
                                  <div style={DT.qtyHint}>Available: {row.quantity_available}</div>
                                </div>
                              ) : (
                                <span style={{ color: '#dee2e6', fontSize: '12px' }}>—</span>
                              )}
                            </td>

                            {/* Action */}
                            <td style={DT.actionCell}>
                              <div style={DT.actionBtns}>
                                {showAddButton && (
                                  <button
                                    style={DT.addBtn(isAddButtonDisabled)}
                                    onClick={addDrugRow}
                                    title={isAddButtonDisabled ? "Please enter quantity for all selected drugs first" : "Add another drug row"}
                                    disabled={isAddButtonDisabled}
                                    onMouseEnter={(e) => {
                                      if (!isAddButtonDisabled) {
                                        e.currentTarget.style.background = '#218838';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isAddButtonDisabled) {
                                        e.currentTarget.style.background = '#28a745';
                                      }
                                    }}
                                  >
                                    +
                                  </button>
                                )}
                                <button
                                  style={DT.deleteBtn}
                                  onClick={() => removeDrugRow(row.id)}
                                  title={drugRows.length === 1 ? 'Clear row' : 'Remove row'}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = '#ffffff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#dc3545'; }}
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Instruction hint */}
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💡</span>
                  <span>Type in the <strong>Drug Name</strong> field to search. The <strong>Qty Used</strong> field is required (turns <span style={{ color: '#28a745', fontWeight: 'bold' }}>green</span> when filled). The <strong style={{ color: '#28a745' }}>+</strong> button appears only after all selected drugs have quantities entered.</span>
                </div>
              </div>
            )}

            {/* Attached Summary Bar */}
            {attachedDrugs.length > 0 && (
              <div style={DT.summaryBar}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#155724', flexShrink: 0 }}>
                  Attached ({attachedDrugs.length}):
                </span>
                {attachedDrugs.map((r) => (
                  <span key={r.id} style={DT.drugChip}>
                    {r.drugName} × {r.quantity}
                    {showBatch && r.batch_number && ` · Batch: ${r.batch_number}`}
                    {showExpiry && r.expiry_date && ` · Exp: ${r.expiry_date}`}
                  </span>
                ))}
              </div>
            )}

            <div style={S.subFooter}>
              <button style={S.btnSecondary} onClick={() => setStep('editor')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}>
                ← Back
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ ...S.btnSecondary, color: '#6c757d' }}
                  onClick={() => setStep('confirm')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}>
                  Skip Drug Attachment
                </button>
                <button
                  style={{
                    ...S.btnPrimary,
                    opacity: drugRows.some((r) => r.drug_id && (!r.quantity || r.quantity === '')) ? 0.6 : 1,
                  }}
                  onClick={() => setStep('confirm')}
                  disabled={drugRows.some((r) => r.drug_id && (!r.quantity || r.quantity === ''))}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0b5ed7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d6efd')}>
                  Continue to Confirm →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm & Submit Modal ── */}
      {step === 'confirm' && (
        <div style={S.subOverlay}>
          <div style={S.confirmModal}>
            <div style={S.subHeader}>
              <span>✅</span>
              <span>Confirm Submission</span>
              <button style={{ ...S.closeBtn, marginLeft: 'auto' }} onClick={() => setStep('drugs')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>✕</button>
            </div>

            <div style={{ padding: '8px 0' }}>
              <div style={S.confirmRow}>
                <span style={S.confirmLabel}>Patient</span>
                <span style={S.confirmVal}>{patient.first_name} {patient.last_name} · {patient.age} years · {patient.sex}</span>
              </div>
              <div style={S.confirmRow}>
                <span style={S.confirmLabel}>Lab Tests</span>
                <span style={S.confirmVal}>{formatLabTests(patient.lab_tests) || '—'}</span>
              </div>
              <div style={S.confirmRow}>
                <span style={S.confirmLabel}>Drugs Attached</span>
                {attachedDrugs.length === 0 ? (
                  <span style={S.confirmValRed}>⚠ No drugs attached</span>
                ) : (
                  <span style={S.confirmVal}>
                    {attachedDrugs.map((r) => {
                      let display = `${r.drugName} ×${r.quantity}`;
                      if (showBatch && r.batch_number) display += ` (Batch: ${r.batch_number})`;
                      if (showExpiry && r.expiry_date) display += ` (Exp: ${r.expiry_date})`;
                      return display;
                    }).join(', ')}
                  </span>
                )}
              </div>
              <div style={S.confirmRow}>
                <span style={S.confirmLabel}>Classification</span>
                <span style={S.confirmValMuted}>
                  ✨ MEDCORE AI will handle this automatically
                </span>
              </div>
            </div>

            {error && (
              <div style={{ padding: '8px 24px', fontSize: '13px', color: '#dc3545' }}>{error}</div>
            )}

            <div style={{ ...S.subFooter, justifyContent: 'space-between' }}>
              <button style={S.btnSecondary} onClick={() => setStep('drugs')} disabled={loading}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}>
                ← Back
              </button>
              <button
                style={{ ...S.btnPrimary, opacity: loading ? 0.8 : 1, minWidth: '160px', justifyContent: 'center' }}
                onClick={submitResults}
                disabled={loading}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0b5ed7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d6efd')}>
                {loading ? (
                  <><span style={S.spinner} /> Submitting...</>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Dialog ── */}
      {success && (
        <SuccessDialog
          onClose={() => { setSuccess(false); onClose(); }}
          onPrint={() => handlePrintConfirmation(true)}
          onNoPrint={() => handlePrintConfirmation(false)}
          printing={printing}
          printSuccess={printSuccess}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .rdw-editor-main { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
        .rdw-option-wrapper { border-radius: 6px !important; border: 1px solid #dee2e6 !important; background: #ffffff !important; }
        .rdw-option-wrapper:hover { background: #f8f9fa !important; box-shadow: none !important; }
        .rdw-option-active { background: #e9ecef !important; box-shadow: none !important; }
        .rdw-dropdown-wrapper { border: 1px solid #dee2e6 !important; background: #ffffff !important; border-radius: 6px !important; }
        .rdw-dropdown-optionwrapper { background: #ffffff !important; border: 1px solid #dee2e6 !important; border-radius: 6px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .public-DraftEditor-content { min-height: 280px !important; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input:focus { outline: none; border-color: #0d6efd !important; box-shadow: 0 0 0 2px rgba(13,110,253,0.1) !important; }
        datalist option { font-size: 12px; padding: 4px; }
      `}</style>
    </>
  );
}

export default TestResultModal;
