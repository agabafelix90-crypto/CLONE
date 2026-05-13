import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faProcedures, faCapsules, faMoneyBillWave, faCog, faBoxes,
  faPills, faTimes, faBars, faStore, faClipboardList,
  faChevronDown, faChevronRight, faBell, faUserPlus, faTrashAlt,
  faSpinner, faKey, faShieldAlt, faHome, faCheckCircle,
  faExclamationCircle, faInfoCircle, faTimesCircle, faFileUpload,
  faDownload, faPrint, faFileAlt, faFlask, faXRay, faPrescriptionBottle,
  faImage, faCloudUploadAlt, faEye, faCheck, faArrowLeft, faExclamationTriangle,
  faRedo, faTrash
} from "@fortawesome/free-solid-svg-icons";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { urls } from "./config.dev";
import { ClipLoader } from "react-spinners";
import JSEncrypt from "jsencrypt";
import SettingsModal from "./SettingsModal";
import SMSSettingsModal from "./SMSSettingsModal";
import InactivePatientsModal from "./InactivePatientsModal";

ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Global Styles ──────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #0b1120;
    --navy-2:    #111827;
    --accent:    #2563eb;
    --accent-2:  #7c3aed;
    --accent-3:  #0ea5e9;
    --green:     #10b981;
    --amber:     #f59e0b;
    --rose:      #ef4444;
    --surface:   #ffffff;
    --surface-2: #f7f8fc;
    --surface-3: #f0f2f9;
    --border:    #e4e7f0;
    --text-1:    #0f172a;
    --text-2:    #374151;
    --text-3:    #9ca3af;
    --sh-xs: 0 1px 2px rgba(0,0,0,0.04);
    --sh-sm: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --sh-md: 0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --sh-lg: 0 20px 50px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
    --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 20px; --r-2xl: 28px;
    --sw: 264px;
    --font: 'DM Sans', system-ui, -apple-system, sans-serif;
    --font-h: 'DM Serif Display', Georgia, serif;
  }

  html, body, #root { height: 100%; }
  body { font-family: var(--font); background: var(--surface-2); color: var(--text-1); -webkit-font-smoothing: antialiased; }

  .admin-sb::-webkit-scrollbar { width: 4px; }
  .admin-sb::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
  .admin-sb::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
  .emp-scr::-webkit-scrollbar { width: 4px; }
  .emp-scr::-webkit-scrollbar-track { background: var(--surface-3); border-radius: 4px; }
  .emp-scr::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .mc { transition: transform 0.22s ease, box-shadow 0.22s ease; }
  .mc:hover { transform: translateY(-2px); box-shadow: var(--sh-md) !important; }
  .nb { transition: all 0.15s !important; }
  .nb:hover { background: rgba(255,255,255,0.07) !important; }
  .nb.act { background: rgba(37,99,235,0.22) !important; color: #fff !important; }
  .sb:hover { background: rgba(37,99,235,0.14) !important; color: rgba(255,255,255,0.92) !important; }
  .emp-tr:hover { background: var(--surface-2) !important; }

  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.5)} }
  .pls { animation: pulse 2.4s ease-in-out infinite; }

  @keyframes fu { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes dropBounce { 0%{transform:translateY(-16px);opacity:0}60%{transform:translateY(4px)}100%{transform:translateY(0);opacity:1} }
  @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(37,99,235,0.35)}70%{box-shadow:0 0 0 14px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)} }
  @keyframes star-twinkle { 0%,100%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1)} }
  @keyframes lonely-float { 0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-12px) rotate(2deg)} }
  @keyframes lonely-pop { 0%{opacity:0;transform:scale(0.9)}60%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)} }
  @keyframes checkmark { 0%{transform:scale(0) rotate(-45deg)}60%{transform:scale(1.2) rotate(0)}100%{transform:scale(1) rotate(0)} }
  @keyframes shake { 0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)} }

  .fu  { animation: fu 0.3s ease both; }
  .fu1 { animation: fu 0.3s 0.05s ease both; }
  .fu2 { animation: fu 0.3s 0.1s ease both; }
  .fu3 { animation: fu 0.3s 0.15s ease both; }
  .fu4 { animation: fu 0.3s 0.2s ease both; }

  /* Modals */
  .mbk {
    position:fixed; inset:0;
    background: rgba(5, 10, 30, 0.55);
    backdrop-filter: blur(10px) saturate(0.8);
    -webkit-backdrop-filter: blur(10px) saturate(0.8);
    z-index:300;
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation: fu 0.2s ease both;
  }
  .mbx {
    background:var(--surface);
    border-radius:var(--r-2xl);
    box-shadow: var(--sh-lg), 0 0 0 1px rgba(0,0,0,0.06);
    width:100%; max-width:520px; max-height:92vh; overflow-y:auto;
    padding:28px;
    animation: fadeUp 0.28s cubic-bezier(0.34,1.26,0.64,1) both;
  }
  .mbx-wide {
    max-width: 960px;
  }
  .mbx::-webkit-scrollbar { width:4px; }
  .mbx::-webkit-scrollbar-track { background:var(--surface-3); border-radius:4px; }
  .mbx::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }

  .pc { display:flex; align-items:flex-start; gap:10px; padding:9px 12px; border-radius:var(--r-sm); transition:background 0.14s; cursor:pointer; }
  .pc:hover { background: var(--surface-3); }
  .pc input[type=checkbox] { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; margin-top:2px; flex-shrink:0; }

  /* Buttons */
  .bp { background:var(--accent); color:#fff; border:none; padding:10px 20px; border-radius:var(--r-md); font-family:var(--font); font-size:13.5px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; letter-spacing:-0.1px; }
  .bp:hover:not(:disabled) { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 16px rgba(37,99,235,0.35); }
  .bp:disabled { opacity:0.5; cursor:not-allowed; }
  .bg { background:var(--surface-3); color:var(--text-2); border:1px solid var(--border); padding:10px 18px; border-radius:var(--r-md); font-family:var(--font); font-size:13.5px; font-weight:500; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; }
  .bg:hover { background:#e8ecf4; }
  .bd { background:#fef2f2; color:var(--rose); border:none; padding:7px 13px; border-radius:var(--r-sm); font-family:var(--font); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; }
  .bd:hover { background:#fee2e2; color:#dc2626; }
  .bo { background:transparent; color:var(--accent); border:1.5px solid var(--accent); padding:7px 13px; border-radius:var(--r-sm); font-family:var(--font); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; }
  .bo:hover { background:rgba(37,99,235,0.06); border-color:#3b82f6; }
  .bdr { background:#ef4444; color:#fff; border:none; padding:9px 16px; border-radius:var(--r-md); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:7px; }
  .bdr:hover:not(:disabled) { background:#dc2626; transform:translateY(-1px); box-shadow:0 4px 16px rgba(239,68,68,0.35); }
  .bdr:disabled { opacity:0.5; cursor:not-allowed; }

  .inp { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:var(--r-md); font-family:var(--font); font-size:14px; color:var(--text-1); background:var(--surface); outline:none; transition:all 0.2s; }
  .inp:focus { border-color:var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .inp::placeholder { color:var(--text-3); }

  .mob-ov { position:fixed; inset:0; background:rgba(11,17,32,0.45); backdrop-filter:blur(4px); z-index:140; }
  .stat-card { position:relative; border-radius:var(--r-lg) !important; overflow:hidden; }

  /* Upload Drop Zone */
  .drop-zone {
    border: 2.5px dashed var(--border);
    border-radius: var(--r-xl);
    padding: 44px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;
    background: var(--surface-2);
    position: relative;
    overflow: hidden;
  }
  .drop-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.25s;
  }
  .drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--accent);
    background: #f0f5ff;
  }
  .drop-zone:hover::before, .drop-zone.drag-over::before { opacity: 1; }
  .drop-zone.drag-over { transform: scale(1.01); box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }

  .upload-icon-wrap {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #eff6ff, #e0e7ff);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
    transition: all 0.25s;
  }
  .drop-zone:hover .upload-icon-wrap {
    transform: scale(1.08);
    background: linear-gradient(135deg, #dbeafe, #c7d2fe);
    animation: pulse-ring 1.6s ease-out infinite;
  }

  /* Format badges */
  .fmt-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
    border: 1px solid;
  }

  /* Step indicators */
  .step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    flex-shrink: 0;
  }

  /* Preview ribbon */
  .preview-ribbon {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    font-size: 10px; font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    display: inline-flex; align-items: center; gap: 4px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  /* Doc preview container */
  .doc-preview-wrap {
    background: #dde1ea;
    padding: 20px;
    border-radius: var(--r-xl);
    overflow-x: auto;
  }
  .doc-sheet {
    background: white;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    margin: 0 auto;
    width: 100%;
    max-width: 760px;
    border-radius: 6px;
    overflow: hidden;
  }
  .doc-header-img {
    width: 100%;
    display: block;
    line-height: 0;
  }
  .doc-header-img img, .doc-header-img svg { width: 100%; height: auto; display: block; }
  .doc-body { padding: 22px 26px; }
  .info-row { display:flex; padding:7px 0; border-bottom:1px dashed #e4e7f0; }
  .info-row:last-child { border-bottom:none; }
  .info-label { width:130px; font-weight:600; color:#374151; font-size:11.5px; }
  .info-value { flex:1; color:#0f172a; font-size:12.5px; font-weight:500; }
  .test-table { width:100%; border-collapse:collapse; margin:16px 0; }
  .test-table th { background:#f0f2f9; padding:9px 12px; text-align:left; font-size:10.5px; font-weight:700; color:#4b5563; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e4e7f0; }
  .test-table td { padding:9px 12px; font-size:12px; color:#374151; border-bottom:1px solid #f0f2f9; }
  .r-ok { color:#10b981; font-weight:600; }
  .r-bad { color:#ef4444; font-weight:600; }

  .sig-section { margin-top:28px; padding-top:18px; border-top:1px solid #e4e7f0; display:flex; justify-content:space-between; }
  .sig-line { width:190px; text-align:center; }
  .sig-line .line { border-top:1px solid #94a3b8; margin:8px 0 4px; }
  .sig-line .lbl { font-size:10px; color:#6b7280; }

  /* Existing header notice */
  .existing-header-notice {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border: 1.5px solid #f59e0b;
    border-radius: var(--r-lg);
    padding: 14px 16px;
    margin-bottom: 20px;
    animation: fadeUp 0.3s ease both;
  }

  @keyframes checkPop { 0%{opacity:0;transform:scale(0.5)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)} }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const cfg = {
    success: { bg:'#f0fdf4', border:'#22c55e', icon: faCheckCircle,    ic:'#16a34a', tx:'#14532d' },
    error:   { bg:'#fef2f2', border:'#ef4444', icon: faTimesCircle,    ic:'#dc2626', tx:'#991b1b' },
    info:    { bg:'#eff6ff', border:'#3b82f6', icon: faInfoCircle,     ic:'#2563eb', tx:'#1e40af' },
    warning: { bg:'#fffbeb', border:'#f59e0b', icon: faExclamationCircle, ic:'#d97706', tx:'#92400e' },
  }[type] || { bg:'#eff6ff', border:'#3b82f6', icon: faInfoCircle, ic:'#2563eb', tx:'#1e40af' };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, background:cfg.bg, borderLeft:`4px solid ${cfg.border}`, borderRadius:14, padding:'13px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', minWidth:280, maxWidth:400, marginBottom:10, animation:'slideIn 0.3s ease both' }}>
      <FontAwesomeIcon icon={cfg.icon} style={{ color:cfg.ic, fontSize:17, flexShrink:0 }}/>
      <span style={{ color:cfg.tx, fontSize:13, fontWeight:500, lineHeight:1.5, flex:1 }}>{message}</span>
      <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:cfg.tx, opacity:0.5, padding:4 }}>
        <FontAwesomeIcon icon={faTimes} style={{ fontSize:11 }}/>
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:1000 }}>
    {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)}/>)}
  </div>
);

// ─── Document Header Modal ─────────────────────────────────────────────────────
const ACCEPTED = ['image/svg+xml','image/png','image/jpeg','image/jpg','image/webp'];
const ACCEPTED_EXT = ['.svg','.png','.jpg','.jpeg','.webp'];
const FORMAT_COLORS = {
  svg:  { bg:'#eff6ff', border:'#93c5fd', text:'#1d4ed8' },
  png:  { bg:'#f0fdf4', border:'#86efac', text:'#15803d' },
  jpg:  { bg:'#fff7ed', border:'#fcd34d', text:'#b45309' },
  jpeg: { bg:'#fff7ed', border:'#fcd34d', text:'#b45309' },
  webp: { bg:'#faf5ff', border:'#c4b5fd', text:'#6d28d9' },
};

const DocumentHeaderModal = ({ token, onClose, addToast, hasExistingHeader, clinicName }) => {
  const [step, setStep]             = useState(1); // 1=upload, 2=preview+confirm
  const [fileData, setFileData]     = useState(null);
  const [docType, setDocType]       = useState('lab');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef                     = useRef(null);

  // Sample SVG template for download
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 150" width="100%" height="100%">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="800" height="150" fill="#ffffff"/>
  <rect x="0" y="0" width="800" height="5" fill="url(#hg)"/>
  <circle cx="56" cy="75" r="28" fill="#eff6ff"/>
  <text x="56" y="83" font-family="Arial" font-size="26" fill="#2563eb" text-anchor="middle">🏥</text>
  <text x="102" y="50" font-family="Arial" font-size="20" font-weight="bold" fill="#0f172a">${clinicName || 'MEDICAL HEALTH CENTER'}</text>
  <text x="102" y="69" font-family="Arial" font-size="10.5" fill="#6b7280" font-style="italic">Excellence in Healthcare · Compassionate Service</text>
  <line x1="102" y1="76" x2="510" y2="76" stroke="#e4e7f0" stroke-width="1"/>
  <text x="102" y="94" font-family="Arial" font-size="10" fill="#4b5563">📞 +256 123 456 789   ✉️ info@clinic.ug   🌐 www.clinic.ug</text>
  <text x="102" y="111" font-family="Arial" font-size="10" fill="#4b5563">📍 Kampala, Uganda   🕒 Mon-Fri: 8AM–9PM   🚑 Emergency: +256 700 000 000</text>
  <rect x="102" y="121" width="690" height="19" rx="5" fill="#f0f2f9"/>
  <text x="110" y="134" font-family="Arial" font-size="9" fill="#4b5563" font-weight="600">SERVICES: General Consultation • Laboratory • Radiology • Pharmacy • Maternity • Dental • Emergency Care</text>
  <rect x="590" y="26" width="200" height="48" rx="7" fill="#f8fafc" stroke="#e4e7f0" stroke-width="1"/>
  <text x="690" y="44" font-family="Arial" font-size="8" fill="#94a3b8" text-anchor="middle" font-weight="600">ACCREDITED BY</text>
  <text x="690" y="59" font-family="Arial" font-size="9" fill="#4b5563" text-anchor="middle" font-weight="700">UGANDA MEDICAL COUNCIL</text>
  <text x="688" y="128" font-family="Arial" font-size="8" fill="#9ca3af" text-anchor="end">Reg: MOH/2024/0789</text>
</svg>`;

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || ext === 'svg';
    const isRaster = ['png','jpg','jpeg','webp'].includes(ext) || ['image/png','image/jpeg','image/webp'].includes(file.type);

    if (!isSvg && !isRaster) {
      addToast('Unsupported file type. Please upload SVG, PNG, JPG, JPEG, or WebP.', 'error');
      return;
    }

    const reader = new FileReader();
    if (isSvg) {
      reader.onload = (e) => {
        const content = e.target.result;
        if (!content.includes('<svg')) { addToast('Invalid SVG file.', 'error'); return; }
        setFileData({ type:'svg', content, name:file.name, format:'svg' });
        setStep(2);
        addToast('SVG header loaded! Review the preview below.', 'success');
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        setFileData({ type:'raster', content: e.target.result, name:file.name, format: ext });
        setStep(2);
        addToast('Image loaded! Review the preview below.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleSave = async () => {
    if (!fileData) return;
    setSaving(true);
    try {
      const payload = fileData.type === 'svg'
        ? { token, svgHeader: fileData.content }
        : { token, imageHeader: fileData.content, imageFormat: fileData.format };

      const r = await fetch(urls.upload_document_header, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        addToast(
          hasExistingHeader
            ? 'Document header replaced successfully! It will appear on all printed documents.'
            : 'Document header saved! It will appear on all printed documents.',
          'success'
        );
        onClose();
      } else {
        const d = await r.json();
        throw new Error(d.error || 'Failed to save');
      }
    } catch (e) { addToast('Error saving: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteHeader = async () => {
    if (!window.confirm('Are you sure you want to delete the current document header? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const r = await fetch(urls.deleteheader, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (r.ok) {
        addToast('Document header deleted successfully.', 'success');
        onClose();
      } else {
        const d = await r.json();
        throw new Error(d.error || 'Failed to delete header');
      }
    } catch (e) { addToast('Error deleting header: ' + e.message, 'error'); }
    finally { setDeleting(false); }
  };

  const downloadSample = () => {
    const blob = new Blob([sampleSvg], { type:'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'document-header-template.svg';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast('SVG template downloaded. Edit it with any design tool or text editor.', 'info');
  };

  const samplePat = { name:'NAKATO SARAH', id:'PT-2024-0789', ageGender:'32 yrs · Female', referredBy:'Dr. MUKASA JOHN' };

  return (
    <div className="mbk">
      <div className="mbx mbx-wide">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FontAwesomeIcon icon={faFileUpload} style={{ color:'#fff', fontSize:18 }}/>
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:400, color:'var(--text-1)', lineHeight:1.2 }}>Document Header</h2>
              <p style={{ fontSize:12.5, color:'var(--text-3)', marginTop:2 }}>Appears on Lab Reports, Prescriptions, Scan Reports & Invoices</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-3)', border:'none', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:'var(--text-2)', transition:'all 0.15s' }}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize:14 }}/>
          </button>
        </div>

        {/* ── Existing Header Notice ── */}
        {hasExistingHeader && (
          <div className="existing-header-notice">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'#fef3c7', border:'1.5px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ color:'#d97706', fontSize:14 }}/>
                </div>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:700, color:'#92400e', marginBottom:3 }}>
                    An existing header is already set for this clinic
                  </p>
                  <p style={{ fontSize:12.5, color:'#b45309', lineHeight:1.6 }}>
                    Uploading a new image will <strong>replace</strong> the current header on all documents. 
                    If you want to remove it entirely, use the delete button.
                  </p>
                </div>
              </div>
              <button
                className="bdr"
                onClick={handleDeleteHeader}
                disabled={deleting}
                style={{ flexShrink:0, alignSelf:'center' }}
              >
                {deleting
                  ? <><FontAwesomeIcon icon={faSpinner} spin/> Deleting…</>
                  : <><FontAwesomeIcon icon={faTrash} style={{ fontSize:12 }}/> Delete Current Header</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
          {[{n:1,label:'Upload Image'},{n:2,label:'Preview & Confirm'}].map((s,i) => (
            <React.Fragment key={s.n}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="step-dot" style={{
                  background: step >= s.n ? 'var(--accent)' : 'var(--surface-3)',
                  color: step >= s.n ? '#fff' : 'var(--text-3)',
                  transition:'all 0.3s',
                  boxShadow: step === s.n ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none'
                }}>
                  {step > s.n ? <FontAwesomeIcon icon={faCheck} style={{fontSize:11}}/> : s.n}
                </div>
                <span style={{ fontSize:13, fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? 'var(--text-1)' : 'var(--text-3)', transition:'all 0.3s' }}>{s.label}</span>
              </div>
              {i < 1 && <div style={{ flex:1, height:2, background: step > 1 ? 'var(--accent)' : 'var(--border)', margin:'0 14px', borderRadius:2, transition:'background 0.4s' }}/>}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === 1 && (
          <div style={{ animation:'fadeUp 0.28s ease both' }}>
            {/* Supported Formats */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'var(--text-3)', fontWeight:500, marginRight:4 }}>Supported formats:</span>
              {Object.entries({ SVG:'svg', PNG:'png', JPG:'jpg', JPEG:'jpeg', WebP:'webp' }).map(([label, fmt]) => {
                const c = FORMAT_COLORS[fmt];
                return (
                  <span key={fmt} className="fmt-badge" style={{ background:c.bg, borderColor:c.border, color:c.text }}>
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Drop Zone */}
            <div
              className={`drop-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon-wrap">
                <FontAwesomeIcon icon={faCloudUploadAlt} style={{ fontSize:28, color:'var(--accent)' }}/>
              </div>
              <h3 style={{ fontFamily:'var(--font-h)', fontSize:18, fontWeight:400, color:'var(--text-1)', marginBottom:8 }}>
                {dragOver ? 'Drop it here!' : (hasExistingHeader ? 'Click or drag your replacement image here' : 'Click or drag your image here')}
              </h3>
              <p style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.6, maxWidth:380, margin:'0 auto 16px' }}>
                Upload your clinic letterhead or logo as SVG, PNG, JPG, JPEG, or WebP.<br/>
                It will appear as a full-width header on all documents.
              </p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', padding:'10px 22px', borderRadius:12, fontSize:13.5, fontWeight:600, boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
                <FontAwesomeIcon icon={faImage}/> Choose Image File
              </div>
              <p style={{ fontSize:11, color:'var(--text-3)', marginTop:14 }}>Max recommended size: 2MB · Aspect ratio: wide letterhead style</p>
              <input ref={fileRef} type="file" accept={ACCEPTED.join(',') + ',' + ACCEPTED_EXT.join(',')} onChange={e => processFile(e.target.files[0])} style={{ display:'none' }}/>
            </div>

            {/* Tips */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:20 }}>
              {[
                { icon:'💡', title:'SVG recommended', desc:'Vector graphics look sharp at any size and scale perfectly.' },
                { icon:'🖼️', title:'PNG / WebP', desc:'Use for logos with transparency. High resolution preferred.' },
                { icon:'📐', title:'Dimensions', desc:'Landscape/wide images work best (e.g. 800×150 px).' },
                { icon:'📄', title:'What to include', desc:'Clinic name, logo, contacts, address, accreditation.' },
              ].map((t,i) => (
                <div key={i} style={{ padding:'12px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <p style={{ fontSize:12.5, fontWeight:600, color:'var(--text-1)', marginBottom:2 }}>{t.title}</p>
                    <p style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.5 }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download Template */}
            <div style={{ marginTop:20, padding:'14px 16px', background:'linear-gradient(135deg,#eff6ff,#f5f3ff)', border:'1px solid #c7d2fe', borderRadius:14, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:180 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#1e40af', marginBottom:2 }}>Need a starting template?</p>
                <p style={{ fontSize:12, color:'#3730a3' }}>Download our pre-built SVG letterhead and customise it with your clinic details.</p>
              </div>
              <button className="bp" onClick={downloadSample} style={{ background:'#4f46e5', whiteSpace:'nowrap' }}>
                <FontAwesomeIcon icon={faDownload}/> Download SVG Template
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview & Confirm ── */}
        {step === 2 && fileData && (
          <div style={{ animation:'fadeUp 0.28s ease both' }}>
            {/* File info bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, padding:'12px 16px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FontAwesomeIcon icon={faCheck} style={{ color:'#fff', fontSize:14 }}/>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{fileData.name}</p>
                  <p style={{ fontSize:11.5, color:'var(--text-3)' }}>File loaded successfully</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span className="fmt-badge" style={{ ...FORMAT_COLORS[fileData.format], borderColor:FORMAT_COLORS[fileData.format]?.border || '#ccc', fontSize:12 }}>
                  {fileData.format.toUpperCase()}
                </span>
                <button className="bg" onClick={() => { setStep(1); setFileData(null); }} style={{ padding:'6px 12px', fontSize:12 }}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize:11 }}/> Change
                </button>
              </div>
            </div>

            {/* Doc type selector */}
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:8 }}>Preview as document type:</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { k:'lab', icon:faFlask, label:'Lab Results' },
                  { k:'xray', icon:faXRay, label:'Scan Report' },
                  { k:'prescription', icon:faPrescriptionBottle, label:'Prescription' },
                ].map(d => (
                  <button key={d.k} onClick={() => setDocType(d.k)} style={{
                    padding:'7px 14px', fontSize:12.5, fontWeight: docType === d.k ? 600 : 400,
                    borderRadius:10, border: docType === d.k ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: docType === d.k ? '#eff6ff' : 'var(--surface)',
                    color: docType === d.k ? 'var(--accent)' : 'var(--text-2)',
                    cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s'
                  }}>
                    <FontAwesomeIcon icon={d.icon} style={{ fontSize:11 }}/> {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <FontAwesomeIcon icon={faEye} style={{ color:'var(--accent)', fontSize:14 }}/>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>Document Preview</span>
                <span className="preview-ribbon"><FontAwesomeIcon icon={faCheckCircle} style={{fontSize:9}}/> Live Preview</span>
              </div>

              <div className="doc-preview-wrap">
                <div className="doc-sheet">
                  {/* Header */}
                  <div className="doc-header-img">
                    {fileData.type === 'svg'
                      ? <div dangerouslySetInnerHTML={{ __html: fileData.content }}/>
                      : <img src={fileData.content} alt="Document header" style={{ width:'100%', display:'block' }}/>
                    }
                  </div>

                  {/* Body */}
                  <div className="doc-body">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                      <h3 style={{ fontSize:13.5, fontWeight:700, color:'var(--text-1)', letterSpacing:'0.4px' }}>
                        {docType === 'lab' ? 'LABORATORY TEST RESULTS' : docType === 'xray' ? 'RADIOLOGY / SCAN REPORT' : 'PATIENT PRESCRIPTION'}
                      </h3>
                      <span style={{ fontSize:10.5, background:'#e0e7ff', color:'#3730a3', padding:'2px 10px', borderRadius:20, fontWeight:600 }}>
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 18px', marginBottom:20, border:'1px solid #e4e7f0' }}>
                      <p style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', letterSpacing:'0.6px', marginBottom:10 }}>PATIENT INFORMATION</p>
                      {[['Full Name', samplePat.name],['Patient ID', samplePat.id],['Age / Gender', samplePat.ageGender],['Date of Visit', new Date().toLocaleDateString('en-UG')],['Referred By', samplePat.referredBy]].map(([l,v]) => (
                        <div key={l} className="info-row"><div className="info-label">{l}:</div><div className="info-value">{v}</div></div>
                      ))}
                    </div>

                    {docType === 'lab' && (
                      <table className="test-table">
                        <thead><tr><th>TEST</th><th>RESULT</th><th>REFERENCE</th><th>STATUS</th></tr></thead>
                        <tbody>
                          {[['CBC','5.8 × 10⁶/µL','4.5–5.9','Normal','ok'],['Haemoglobin','13.2 g/dL','12–16','Normal','ok'],['WBC','11.5 × 10³/µL','4–11','High','bad'],['Malaria','Negative','Negative','Normal','ok'],['Typhoid','Positive','Negative','Reactive','bad']].map(([t,r,ref,s,c]) => (
                            <tr key={t}><td>{t}</td><td>{r}</td><td>{ref}</td><td className={c==='ok'?'r-ok':'r-bad'}>{s}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {docType === 'xray' && (
                      <div style={{ padding:'14px', background:'#fefce8', borderRadius:10, border:'1px solid #fde047', fontSize:12.5, lineHeight:1.7, color:'var(--text-2)' }}>
                        <p><strong>Examination:</strong> Chest X-Ray (PA View)</p>
                        <p style={{ marginTop:8 }}><strong>Findings:</strong> The cardiomediastinal silhouette is within normal limits. The lungs are clear with no consolidation, effusion, or pneumothorax. Bilateral hilar contours are normal.</p>
                        <p style={{ marginTop:8 }}><strong>Impression:</strong> Normal chest X-ray. No acute cardiopulmonary findings.</p>
                      </div>
                    )}
                    {docType === 'prescription' && (
                      <table className="test-table">
                        <thead><tr><th>MEDICATION</th><th>DOSAGE</th><th>FREQUENCY</th><th>DURATION</th></tr></thead>
                        <tbody>
                          {[['Amoxicillin 500mg','1 tablet','Twice daily','7 days'],['Paracetamol 500mg','1–2 tablets','As needed','5 days'],['Multivitamins','1 tablet','Once daily','30 days']].map(([m,d,f,du]) => (
                            <tr key={m}><td>{m}</td><td>{d}</td><td>{f}</td><td>{du}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="sig-section">
                      <div className="sig-line"><div className="line"/><div className="lbl">Patient / Guardian Signature</div></div>
                      <div className="sig-line"><div className="line"/><div className="lbl">Medical Officer Signature & Stamp</div></div>
                    </div>
                    <div style={{ marginTop:16, textAlign:'center', fontSize:9, color:'#9ca3af', borderTop:'1px solid #f0f2f9', paddingTop:10 }}>
                      <p>Computer-generated document · {clinicName || 'Medical Health Center'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm save */}
            <div style={{
              padding:'16px 18px',
              background: hasExistingHeader
                ? 'linear-gradient(135deg,#fffbeb,#fef3c7)'
                : 'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
              border: `1px solid ${hasExistingHeader ? '#f59e0b' : '#86efac'}`,
              borderRadius:14, marginBottom:20, display:'flex', alignItems:'center', gap:12
            }}>
              <FontAwesomeIcon
                icon={hasExistingHeader ? faRedo : faCheckCircle}
                style={{ color: hasExistingHeader ? '#d97706' : '#16a34a', fontSize:20, flexShrink:0 }}
              />
              <div>
                <p style={{ fontSize:13, fontWeight:600, color: hasExistingHeader ? '#92400e' : '#14532d' }}>
                  {hasExistingHeader ? 'Ready to replace the current header?' : 'Looking good? Save to apply.'}
                </p>
                <p style={{ fontSize:12, color: hasExistingHeader ? '#b45309' : '#166534', marginTop:2 }}>
                  {hasExistingHeader
                    ? 'This will permanently replace your existing header on all Lab Results, Scan Reports, Prescriptions, and Invoices.'
                    : 'This header will appear on all Lab Results, Scan Reports, Prescriptions, and Invoices when printed.'
                  }
                </p>
              </div>
            </div>

            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', flexWrap:'wrap' }}>
              <button className="bg" onClick={() => { setStep(1); setFileData(null); }}>
                <FontAwesomeIcon icon={faArrowLeft}/> Choose Different Image
              </button>
              <button className="bg" onClick={onClose}>Cancel</button>
              <button className="bp" onClick={handleSave} disabled={saving} style={{
                minWidth:190,
                background: hasExistingHeader ? '#d97706' : 'var(--accent)',
              }}>
                {saving
                  ? <><FontAwesomeIcon icon={faSpinner} spin/> {hasExistingHeader ? 'Replacing…' : 'Saving…'}</>
                  : hasExistingHeader
                    ? <><FontAwesomeIcon icon={faRedo}/> Replace Header</>
                    : <><FontAwesomeIcon icon={faCheckCircle}/> Save & Apply Header</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (v) => `UGX ${Number(v).toLocaleString()}`;
const setTheme = (isMob) => {
  if (typeof document === 'undefined') return;
  const sm = (n, c) => { let e = document.querySelector(`meta[name="${n}"]`); if (!e) { e = document.createElement('meta'); e.setAttribute('name', n); document.head.appendChild(e); } e.setAttribute('content', c); };
  sm('theme-color', isMob ? '#fff' : '#0b1120');
  sm('apple-mobile-web-app-status-bar-style', isMob ? 'black-translucent' : 'default');
};

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAup3FU135mAvJT6OheYW3
pQyWf6jvS4duUMY4cXrlJXyGqu8HqvTU0ewPy6w2HhCPxWboNclkAkPhOCc4URNT
x1Grg+mCsWmfhVimP2wtfmlBCJ09cyDMYf93iGj8RFf3CshY5yhppT/pX+RgTuXw
ClpOXe24CLG2VF9suNylk+ReAMLyOxaekYofAMBvvrD4+GYPJgvkTMXCXCKp2PnO
8+OjiltNMnoyqPEZoXHTV4EXtTrjYnwzSe0WZSSuzgVMhmtdx+IS4eisSumHV1eI
wBeZwI0bYGxDCedPRassmSFgTFqkkcgIXmEP1n5w/08S/QPr2G+myKTeRqp5RJA5
PQIDAQAB
-----END PUBLIC KEY-----`;

const PERMS = [
  { key:"Store",                                label:"Access Store",                              c:true,  p:true  },
  { key:"selldrugs",                            label:"Access Dispensary / Drug Shelves",          c:true,  p:true  },
  { key:"sales",                                label:"Access Cashier Dashboard",                  c:true,  p:true  },
  { key:"makeOrderForDrugs",                    label:"Make Order for Drugs",                      c:true,  p:true  },
  { key:"manageDrugs",                          label:"Manage Drugs (add, delete, modify stock)",  c:true,  p:true  },
  { key:"access-sales-details",                 label:"Access Sales History Details",              c:true,  p:true  },
  { key:"delete-sale",                          label:"Delete a Sale from Records",                c:true,  p:true  },
  { key:"set-sales-expenses-categories",        label:"Set Sales & Expenses Categories",           c:true,  p:true  },
  { key:"sendwhatsappmessages",                 label:"Send SMS Messages",                         c:true,  p:true  },
  { key:"clinicStatistics",                     label:"Access Statistics / Reports",               c:true,  p:true  },
  { key:"manageServices",                       label:"Manage Services (add, edit, delete)",       c:true,  p:false },
  { key:"editBills",                            label:"Edit Patient Bills",                        c:true,  p:false },
  { key:"access-doctors-room",                  label:"Access Doctors Room",                       c:true,  p:false },
  { key:"access-nurse",                         label:"Access Nurses Section",                     c:true,  p:false },
  { key:"triage",                               label:"Access Triage Department",                  c:true,  p:false },
  { key:"access-laboratory",                    label:"Access Laboratory Section",                 c:true,  p:false },
  { key:"access-radiographer",                  label:"Access Radiology Section",                  c:true,  p:false },
  { key:"manageLaboratory",                     label:"Manage Lab & Radiology Investigations",     c:true,  p:false },
  { key:"familyPlanning",                       label:"Manage Family Planning Settings",           c:true,  p:false },
  { key:"view costs spent on treating patient", label:"View Costs Spent Treating a Patient",       c:true,  p:false },
];
const initPerms = () => Object.fromEntries(PERMS.map(p => [p.key, false]));

// ─── Empty State ──────────────────────────────────────────────────────────────
const LonelyState = ({ onAdd }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:320 }}>
    <div style={{ position:'relative', marginBottom:28 }}>
      {[{top:-10,left:-28,delay:0},{top:0,right:-30,delay:0.4},{top:30,left:-40,delay:0.8},{top:20,right:-42,delay:1.2}].map((s,i)=>(
        <div key={i} style={{ position:'absolute', top:s.top, left:s.left, right:s.right, fontSize:14, animation:`star-twinkle 2.2s ${s.delay}s ease-in-out infinite`, opacity:0 }}>✦</div>
      ))}
      <div style={{ fontSize:72, lineHeight:1, animation:'lonely-float 3.5s ease-in-out infinite', display:'inline-block', filter:'drop-shadow(0 8px 16px rgba(37,99,235,0.18))' }}>👤</div>
    </div>
    <div style={{ animation:'lonely-pop 0.5s 0.2s ease both', opacity:0 }}>
      <h3 style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:400, color:'var(--text-1)', marginBottom:10 }}>
        Looks a little lonely here!
      </h3>
      <p style={{ fontSize:14, color:'var(--text-3)', maxWidth:340, lineHeight:1.7, marginBottom:24 }}>
        Add your employees, allocate them <strong style={{ color:'var(--accent)' }}>permissions</strong> and <strong style={{ color:'var(--accent-2)' }}>login codes</strong> to get your team running.
      </p>
      <button className="bp" onClick={onAdd} style={{ padding:'12px 28px', fontSize:14, borderRadius:14 }}>
        <FontAwesomeIcon icon={faUserPlus} style={{ fontSize:13 }}/> Add First Employee
      </button>
    </div>
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge = ({ label, color, value }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:30, background:`${color}0d`, border:`1px solid ${color}22` }}>
    <span style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
    <span style={{ fontSize:11, color, fontWeight:600 }}>{label}</span>
    <span style={{ fontSize:11, color:'var(--text-2)', marginLeft:1 }}>{value}</span>
  </div>
);

const Card = ({ icon, label, value, color }) => (
  <div className="mc stat-card" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:'18px 20px', boxShadow:'var(--sh-sm)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
    <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${color},${color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <FontAwesomeIcon icon={icon} style={{ fontSize:19, color:'#fff' }}/>
    </div>
    <div style={{ minWidth:0 }}>
      <p style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', marginBottom:4, letterSpacing:'0.5px', textTransform:'uppercase' }}>{label}</p>
      <p style={{ fontSize:20, fontWeight:700, color:'var(--text-1)', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-h)' }}>{value}</p>
    </div>
  </div>
);

const KBox = ({ title, desc, accent }) => (
  <div style={{ padding:'16px 18px', borderRadius:'var(--r-md)', background:'var(--surface)', boxShadow:'var(--sh-xs)', border:`1px solid ${accent}22`, borderLeft:`4px solid ${accent}` }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:accent, flexShrink:0 }}/>
      <h4 style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{title}</h4>
    </div>
    <p style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.6 }}>{desc}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [empName, setEmpName]           = useState('');
  const [clinicName, setClinicName]     = useState('');
  const [district, setDistrict]         = useState('');
  const [setupType, setSetupType]       = useState(null);
  const [token, setToken]               = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [hasHeader, setHasHeader]       = useState(false); // tracks has_header from security
  const [sw, setSw]                     = useState(window.innerWidth);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [view, setView]                 = useState('dashboard');
  const [settOpen, setSettOpen]         = useState(true);

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const [dash, setDash] = useState({
    employees:0, activePatients:0, inactivePatients:0, lostClients:0,
    drugsWorth:0, dispensaryWorth:0, stockWorth:0, revenue:0,
  });

  const [showSett, setShowSett]           = useState(false);
  const [showSMS, setShowSMS]             = useState(false);
  const [showInact, setShowInact]         = useState(false);
  const [showDocHeader, setShowDocHeader] = useState(false);
  const chartRef = useRef(null);

  const [emps, setEmps]         = useState([]);
  const [empLoad, setEmpLoad]   = useState(false);
  const [delIdx, setDelIdx]     = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [neName, setNeName]     = useState('');
  const [neRole, setNeRole]     = useState('');
  const [nePassword, setNePassword] = useState('');
  const [addBusy, setAddBusy]   = useState(false);
  const [showPerm, setShowPerm] = useState(false);
  const [selEmp, setSelEmp]     = useState(null);
  const [perms, setPerms]       = useState(initPerms());
  const [selAll, setSelAll]     = useState(false);
  const [lcode, setLcode]       = useState('');
  const [permBusy, setPermBusy] = useState(false);
  const [permLoad, setPermLoad] = useState(false);

  const mob = sw < 768;
  const isPharm = setupType === 'pharmacy';

  useEffect(() => {
    const h = () => setSw(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  useEffect(() => { setTheme(mob); }, [mob]);

  useEffect(() => {
    (async () => {
      try {
        const t = new URLSearchParams(window.location.search).get('token');
        const r = await fetch(urls.security, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ token: t }),
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (d.message === 'Session valid') {
          setEmpName(d.employee_name);
          setClinicName(d.clinic);
          setDistrict(d.district);
          setSetupType(d.set_up || 'clinic');
          setToken(t);
          setSessionToken(d.clinic_session_token);
          // Track has_header from security response
          setHasHeader(d.has_header === 'yes');
          fetchDash(t);
        } else if (d.error === 'Session expired') {
          navigate(`/dashboard?token=${d.clinic_session_token}`);
        } else { navigate('/login'); }
      } catch { navigate('/login'); }
    })();
  }, [navigate]);

  const fetchDash = async (t) => {
    try {
      const r = await fetch(urls.fetchAdminData, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: t }),
      });
      if (r.ok) {
        const d = await r.json();
        setDash({
          employees:        d.employee_count,
          activePatients:   d.active_patients_count   || 0,
          inactivePatients: d.inactive_patients_count || 0,
          lostClients:      d.lost_clients_count      || 0,
          drugsWorth:       Math.round(d.total_worth      || 0),
          dispensaryWorth:  Math.round(d.dispensary_worth || 0),
          stockWorth:       Math.round(d.stock_worth      || 0),
          revenue:          Math.round(d.revenue          || 0),
        });
      }
    } finally { setLoading(false); }
  };

  const fetchEmps = useCallback(async () => {
    if (!sessionToken) return;
    setEmpLoad(true);
    try {
      const r = await fetch(`${urls.fetchemployees2}?token=${sessionToken}`);
      if (r.ok) setEmps(await r.json());
    } finally { setEmpLoad(false); }
  }, [sessionToken]);

  useEffect(() => {
    if (view === 'employees' && sessionToken) {
      fetchEmps();
      const iv = setInterval(fetchEmps, 60000);
      return () => clearInterval(iv);
    }
  }, [view, sessionToken, fetchEmps]);

  useEffect(() => {
    if (!showPerm || !selEmp) return;
    (async () => {
      setPermLoad(true);
      try {
        const t = new URLSearchParams(window.location.search).get('token');
        const r = await fetch(urls.fetchpermissions2, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ employeeName: selEmp.Name, token: t }),
        });
        if (!r.ok) throw new Error();
        const { permissions: p } = await r.json();
        const m = {
          Store: p.includes('store'),
          selldrugs: p.includes('selldrugs'),
          'access-laboratory': p.includes('access-laboratory'),
          sales: p.includes('sales'),
          'access-radiographer': p.includes('access-radiographer'),
          'view costs spent on treating patient': p.includes('view costs spent on treating patient'),
          makeOrderForDrugs: p.includes('makeorderfordrugs'),
          clinicStatistics: p.includes('clinicstatistics'),
          'access-doctors-room': p.includes('access-doctors-room'),
          'access-nurse': p.includes('access-nurse'),
          manageDrugs: p.includes('managedrugs'),
          triage: p.includes('triage'),
          manageLaboratory: p.includes('managelaboratory'),
          'access-sales-details': p.includes('access-sales-details'),
          'delete-sale': p.includes('delete-sale'),
          familyPlanning: p.includes('familyplanning'),
          manageServices: p.includes('manageservices'),
          editBills: p.includes('editbills'),
          'set-sales-expenses-categories': p.includes('set-sales-expenses-categories'),
          sendwhatsappmessages: p.includes('sendwhatsappmessages'),
        };
        setPerms(prev => ({ ...prev, ...m }));
        setSelAll(Object.values(m).every(Boolean));
      } catch(e) { addToast('Error fetching permissions: ' + e.message, 'error'); }
      finally { setPermLoad(false); }
    })();
  }, [showPerm, selEmp]);

  const doDelete = async (name, role, idx) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDelIdx(idx);
    try {
      const t = new URLSearchParams(window.location.search).get('token');
      const r = await fetch(urls.deleteEmployee, {
        method:'DELETE', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, role, token: t }),
      });
      if (r.ok) { setEmps(p => p.filter(e => e.Name !== name)); addToast(`${name} deleted.`, 'success'); }
      else throw new Error('Delete failed');
    } catch(e) { addToast(e.message, 'error'); }
    finally { setDelIdx(null); }
  };

  const doAdd = async () => {
    if (!neName.trim() || !neRole.trim()) { addToast('Please fill in both name and role.', 'warning'); return; }
    setAddBusy(true);
    try {
      const t = new URLSearchParams(window.location.search).get('token');
      const r = await fetch(urls.addemployee, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: neName, role: neRole, employeePassword: nePassword, token: t }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setShowAdd(false);
        setNeName('');
        setNeRole('');
        setNePassword('');
        fetchEmps();
        addToast(`${neName} added as ${neRole}.`, 'success');
      } else {
        throw new Error(d.message || d.error || 'Failed to add employee');
      }
    } catch(e) { addToast(e.message, 'error'); }
    finally { setAddBusy(false); }
  };

  const doPerms = async () => {
    setPermBusy(true);
    try {
      const t = new URLSearchParams(window.location.search).get('token');
      const enc = new JSEncrypt(); enc.setPublicKey(PUB_KEY);
      const r = await fetch(urls.updatepermissions, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          employeeName: selEmp.Name, permissions: perms,
          token: t, loginCode: enc.encrypt(lcode.toString()),
        }),
      });
      if (r.ok) { setShowPerm(false); setPerms(initPerms()); setLcode(''); setSelAll(false); addToast(`Permissions updated for ${selEmp.Name}.`, 'success'); }
      else throw new Error('Update failed');
    } catch(e) { addToast(e.message, 'error'); }
    finally { setPermBusy(false); }
  };

  const toggleAll = () => { const n = !selAll; setSelAll(n); const u = {}; PERMS.forEach(p => { u[p.key] = n; }); setPerms(u); };

  const chartClick = (ev) => {
    if (!chartRef.current) return;
    const pts = chartRef.current.getElementsAtEventForMode(ev, 'nearest', { intersect:true }, true);
    if (pts.length && pts[0].datasetIndex === 0 && pts[0].index === 1) setShowInact(true);
  };

  const cOpts = {
    maintainAspectRatio:false, cutout:'55%',
    plugins: { legend:{ display:false }, tooltip:{ backgroundColor:'#0f172a', padding:10, cornerRadius:8, titleFont:{ family:"'DM Sans', sans-serif", weight:'600' }, bodyFont:{ family:"'DM Sans', sans-serif" } } },
  };

  const patData = isPharm ? null : {
    labels:['Active','Inactive','Lost'],
    datasets:[{ data:[dash.activePatients, dash.inactivePatients, dash.lostClients], backgroundColor:['#10b981','#f59e0b','#ef4444'], hoverBackgroundColor:['#059669','#d97706','#dc2626'], borderWidth:0, hoverOffset:6 }],
  };
  const stData = {
    labels:['Dispensary','Store'],
    datasets:[{ data:[dash.dispensaryWorth, dash.stockWorth], backgroundColor:['#2563eb','#7c3aed'], hoverBackgroundColor:['#1d4ed8','#6d28d9'], borderWidth:0, hoverOffset:6 }],
  };

  const metrics = isPharm
    ? [
        { icon:faUsers,         label:'Employees',        value:dash.employees,           color:'#2563eb' },
        { icon:faBoxes,         label:'Stock Worth',       value:fmt(dash.stockWorth),     color:'#10b981' },
        { icon:faStore,         label:'Dispensary Worth',  value:fmt(dash.dispensaryWorth),color:'#f59e0b' },
        { icon:faMoneyBillWave, label:'Total Drugs Worth', value:fmt(dash.drugsWorth),     color:'#7c3aed' },
      ]
    : [
        { icon:faUsers,         label:'Employees',       value:dash.employees,           color:'#2563eb' },
        { icon:faProcedures,    label:'Active Patients',  value:dash.activePatients,      color:'#10b981' },
        { icon:faCapsules,      label:'Drugs Worth',      value:fmt(dash.drugsWorth),     color:'#f59e0b' },
        { icon:faMoneyBillWave, label:'Monthly Revenue',  value:fmt(dash.revenue),        color:'#7c3aed' },
      ];

  const today = new Date().toLocaleDateString('en-UG', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const goTo  = (v) => { setView(v); if (mob) setMenuOpen(false); };
  const isLonely = !empLoad && emps.length === 1 && emps[0]?.Name?.toLowerCase() === 'admin';

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--surface-2)' }}>
      <style>{globalStyles}</style>
      <div style={{ textAlign:'center' }}>
        <ClipLoader size={34} color="#2563eb"/>
        <p style={{ marginTop:12, fontSize:13, color:'var(--text-3)', fontFamily:'var(--font)' }}>Loading dashboard…</p>
      </div>
    </div>
  );

  // ── Sidebar nav button ──
  const NB = ({ icon, label, v, sub }) => {
    const act = view === v;
    return (
      <button className={`nb${act ? ' act' : ''}`} onClick={() => v && goTo(v)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding: sub ? '8px 10px 8px 16px' : '10px 12px',
        borderRadius:'var(--r-sm)', background: act ? 'rgba(37,99,235,0.22)' : 'transparent',
        border:'none', color: act ? '#fff' : (sub ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.78)'),
        fontFamily:'var(--font)', fontSize: sub ? 13 : 13.5, fontWeight: act ? 600 : 400,
        cursor:'pointer', textAlign:'left',
      }}>
        {icon && (
          <span style={{ width:sub?24:28, height:sub?24:28, borderRadius:sub?7:9, background:act?'rgba(255,255,255,0.1)':(sub?'transparent':'rgba(255,255,255,0.05)'), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FontAwesomeIcon icon={icon} style={{ fontSize:sub?10:12.5, color:act?'#fff':(sub?'rgba(255,255,255,0.4)':'#93c5fd') }}/>
          </span>
        )}
        {label}
      </button>
    );
  };

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  // NOTE: Background changed to #001969 as requested
  const Sidebar = () => (
    <aside className="admin-sb" style={{
      width:'var(--sw)', display:'flex', flexDirection:'column',
      position:'fixed', top:0, bottom:0, left:0, zIndex:150, overflowY:'auto',
      background:'#001969',
      borderRight:'1px solid rgba(255,255,255,0.08)',
      transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      transform: mob ? (menuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
    }}>
      <div style={{ padding:'20px 16px 14px' }}>
        {mob && (
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:'6px 9px', color:'#fff', cursor:'pointer' }}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize:13 }}/>
          </button>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FontAwesomeIcon icon={isPharm?faPills:faClipboardList} style={{ color:'#fff', fontSize:14 }}/>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-h)', fontSize:13, fontWeight:400, color:'#fff', lineHeight:1.2 }}>{clinicName||(isPharm?'PHARMACY PRO':'CLINIC PRO')}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.5px', textTransform:'uppercase' }}>{district||'Uganda'}</div>
          </div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'14px 0 8px' }}/>
        <p style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 4px 4px', userSelect:'none' }}>Main</p>
        <NB icon={faHome}  label="Dashboard"          v="dashboard"/>
        <NB icon={faUsers} label="Employee Settings"  v="employees"/>

        <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'10px 0 8px' }}/>

        {/* Document Header button — shows indicator dot if header already exists */}
        <button
          className="nb sb"
          onClick={() => { setShowDocHeader(true); if (mob) setMenuOpen(false); }}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:'var(--r-sm)', background:'transparent', border:'none', color:'rgba(255,255,255,0.78)', fontFamily:'var(--font)', fontSize:13.5, fontWeight:400, cursor:'pointer', textAlign:'left', marginBottom:4 }}
        >
          <span style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <FontAwesomeIcon icon={faFileUpload} style={{ fontSize:12, color:'#93c5fd' }}/>
            {hasHeader && (
              <span style={{ position:'absolute', top:-3, right:-3, width:8, height:8, borderRadius:'50%', background:'#f59e0b', border:'2px solid #001969' }}/>
            )}
          </span>
          Document Header
          {hasHeader && (
            <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, background:'rgba(245,158,11,0.18)', color:'#fbbf24', padding:'2px 7px', borderRadius:10, letterSpacing:'0.3px' }}>SET</span>
          )}
        </button>

        <button className="nb" onClick={() => setSettOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'var(--r-sm)', background:'transparent', border:'none', color:'rgba(255,255,255,0.78)', fontFamily:'var(--font)', fontSize:13.5, fontWeight:400, cursor:'pointer' }}>
          <span style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FontAwesomeIcon icon={faCog} style={{ fontSize:12, color:'#93c5fd' }}/>
            </span>
            Settings
          </span>
          <FontAwesomeIcon icon={settOpen?faChevronDown:faChevronRight} style={{ fontSize:10, opacity:0.3 }}/>
        </button>

        {settOpen && (
          <div style={{ paddingLeft:12, marginTop:2, display:'flex', flexDirection:'column', gap:2 }}>
            <button className="nb sb" onClick={() => { setShowSett(true); if (mob) setMenuOpen(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px 8px 18px', borderRadius:'var(--r-sm)', background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer', textAlign:'left' }}>
              <FontAwesomeIcon icon={faKey} style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}/> Change Passwords
            </button>
            <button className="nb sb" onClick={() => { setShowSMS(true); if (mob) setMenuOpen(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px 8px 18px', borderRadius:'var(--r-sm)', background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer', textAlign:'left' }}>
              <FontAwesomeIcon icon={faBell} style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}/> SMS Settings
            </button>
          </div>
        )}
      </div>

      <div style={{ flex:1 }}/>

      <div style={{ margin:'12px', padding:'12px 14px', borderRadius:'var(--r-md)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-h)', fontSize:14, fontWeight:400, color:'#fff', flexShrink:0 }}>
          {empName ? empName.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{empName||'Admin'}</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.3px' }}>Administrator</div>
        </div>
        <div className="pls" style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', marginLeft:'auto', flexShrink:0 }}/>
      </div>
    </aside>
  );

  const TB = ({ title, sub }) => (
    <div className="fu" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-h)', fontSize:mob?22:26, fontWeight:400, color:'var(--text-1)', letterSpacing:'-0.2px', lineHeight:1.2 }}>{title}</h1>
        {sub && <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>{sub}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'var(--surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <FontAwesomeIcon icon={faBell} style={{ fontSize:13, color:'var(--text-2)' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:40, padding:'4px 12px 4px 8px' }}>
          <div style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff' }}>
            {empName ? empName.charAt(0).toUpperCase() : 'A'}
          </div>
          <span style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{empName||'Admin'}</span>
        </div>
      </div>
    </div>
  );

  const DashView = () => (
    <>
      <TB title="" sub={today}/>
      <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:28 }}>
        {metrics.map((m,i) => <div key={i} className={`fu${i}`}><Card {...m}/></div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':(isPharm?'minmax(0,480px)':'repeat(auto-fit,minmax(340px,1fr))'), gap:20, marginBottom:24 }}>
        {!isPharm && patData && (
          <div className="fu2" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:'20px', boxShadow:'var(--sh-sm)', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:400, color:'var(--text-1)' }}>Patient Distribution</h3>
              <span style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', background:'var(--surface-3)', padding:'2px 8px', borderRadius:20 }}>This Period</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Overview of patient engagement status</p>
            <div style={{ position:'relative', height:210 }}>
              <Doughnut ref={chartRef} data={patData} onClick={chartClick} options={cOpts}/>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <span style={{ fontSize:24, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-h)' }}>{dash.activePatients+dash.inactivePatients+dash.lostClients}</span>
                <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Total</span>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
              <Badge label="Active"   color="#10b981" value={dash.activePatients}/>
              <Badge label="Inactive" color="#f59e0b" value={dash.inactivePatients}/>
              <Badge label="Lost"     color="#ef4444" value={dash.lostClients}/>
            </div>
          </div>
        )}
        <div className="fu3" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:'20px', boxShadow:'var(--sh-sm)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:400, color:'var(--text-1)' }}>{isPharm?'Inventory Worth':'Drug Stock Worth'}</h3>
            <span style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', background:'var(--surface-3)', padding:'2px 8px', borderRadius:20 }}>Live</span>
          </div>
          <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Dispensary vs store stock value</p>
          <div style={{ position:'relative', height:210 }}>
            <Doughnut data={stData} options={cOpts}/>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', fontFamily:'var(--font-h)', textAlign:'center', padding:'0 10px', lineHeight:1.3 }}>{fmt(dash.drugsWorth)}</span>
              <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:500 }}>Total</span>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
            <Badge label="Dispensary" color="#2563eb" value={fmt(dash.dispensaryWorth)}/>
            <Badge label="Store"      color="#7c3aed" value={fmt(dash.stockWorth)}/>
          </div>
        </div>
      </div>
      {!isPharm && (
        <div className="fu4" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:'20px', boxShadow:'var(--sh-sm)', border:'1px solid var(--border)', marginBottom:24 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontSize:15, fontWeight:400, color:'var(--text-1)', marginBottom:12 }}>Patient Classification Key</h3>
          <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
            <KBox title="Active Clients"   accent="#10b981" desc="Visited multiple times in 6 months, or once in the last 4 months."/>
            <KBox title="Inactive Clients" accent="#f59e0b" desc="Visited 6–12 months ago, or had a single visit 4–8 months ago."/>
            <KBox title="Lost Clients"     accent="#ef4444" desc="Absent for over 12 months regardless of previous visit frequency."/>
          </div>
        </div>
      )}
    </>
  );

  const EmpView = () => (
    <>
      <TB title="Employee Settings" sub="Manage staff accounts and access permissions"/>
      <div className="fu1" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', boxShadow:'var(--sh-sm)', border:'1px solid var(--border)', marginBottom:20, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:10 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-h)', fontSize:16, fontWeight:400, color:'var(--text-1)' }}>All Employees</h3>
            <p style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{emps.length} member{emps.length!==1?'s':''}</p>
          </div>
          <button className="bp" onClick={() => setShowAdd(true)}>
            <FontAwesomeIcon icon={faUserPlus} style={{ fontSize:12 }}/> Add Employee
          </button>
        </div>

        {empLoad ? (
          <div style={{ padding:40, textAlign:'center' }}><ClipLoader size={28} color="#2563eb"/></div>
        ) : isLonely ? (
          <LonelyState onAdd={() => setShowAdd(true)}/>
        ) : emps.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>No employees found.</div>
        ) : mob ? (
          <div>
            {emps.map((e,i) => (
              <div key={e.EmployeeID} className="emp-tr" style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, transition:'background 0.15s' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${['#2563eb','#10b981','#f59e0b','#7c3aed','#ef4444'][i%5]},${['#7c3aed','#0ea5e9','#fbbf24','#a855f7','#f43f5e'][i%5]})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-h)', fontSize:14, fontWeight:400, color:'#fff', flexShrink:0 }}>
                  {e.Name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13.5, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.Name}</p>
                  <p style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{e.Role}</p>
                </div>
                {i !== 0 && (
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button className="bo" onClick={() => { setSelEmp(e); setPerms(initPerms()); setShowPerm(true); }} style={{ padding:'5px 10px', fontSize:11 }}><FontAwesomeIcon icon={faShieldAlt} style={{ fontSize:11 }}/> Perms</button>
                    <button className="bd" onClick={() => doDelete(e.Name, e.Role, i)} style={{ padding:'5px 10px', fontSize:11 }}>
                      {delIdx===i ? <FontAwesomeIcon icon={faSpinner} spin/> : <FontAwesomeIcon icon={faTrashAlt} style={{ fontSize:11 }}/>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface-2)' }}>
                  {['Employee','Role','Permissions','Action'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.6px', textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emps.map((e,i) => (
                  <tr key={e.EmployeeID} className="emp-tr" style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}>
                    <td style={{ padding:'12px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${['#2563eb','#10b981','#f59e0b','#7c3aed','#ef4444'][i%5]},${['#7c3aed','#0ea5e9','#fbbf24','#a855f7','#f43f5e'][i%5]})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-h)', fontSize:13, fontWeight:400, color:'#fff', flexShrink:0 }}>
                          {e.Name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600, color:'var(--text-1)' }}>{e.Name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:20, background:'var(--surface-3)', fontSize:11.5, fontWeight:500, color:'var(--text-2)' }}>{e.Role}</span>
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      {i!==0
                        ? <button className="bo" onClick={() => { setSelEmp(e); setPerms(initPerms()); setShowPerm(true); }}><FontAwesomeIcon icon={faShieldAlt} style={{ fontSize:11 }}/> Manage</button>
                        : <span style={{ fontSize:11, color:'var(--text-3)', fontStyle:'italic' }}>Owner</span>
                      }
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      {i!==0 && (
                        <button className="bd" onClick={() => doDelete(e.Name, e.Role, i)}>
                          {delIdx===i ? <><FontAwesomeIcon icon={faSpinner} spin/> Deleting…</> : <><FontAwesomeIcon icon={faTrashAlt} style={{ fontSize:11 }}/> Delete</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display:'flex', minHeight:'100vh', background:'var(--surface-2)', fontFamily:'var(--font)' }}>
        <ToastContainer toasts={toasts} removeToast={removeToast}/>

        {mob && !menuOpen && (
          <button onClick={() => setMenuOpen(true)} style={{ position:'fixed', top:12, left:12, zIndex:200, background:'#001969', border:'none', borderRadius:10, padding:'9px 12px', color:'#fff', cursor:'pointer', boxShadow:'var(--sh-md)' }}>
            <FontAwesomeIcon icon={faBars} style={{ fontSize:15 }}/>
          </button>
        )}

        <Sidebar/>
        {mob && menuOpen && <div className="mob-ov" onClick={() => setMenuOpen(false)}/>}

        <main style={{ flex:1, marginLeft:mob?0:'var(--sw)', padding:mob?'60px 16px 30px':'28px 32px 38px', maxWidth:'100%', minWidth:0 }}>
          {view === 'dashboard' && <DashView/>}
          {view === 'employees' && <EmpView/>}
          <footer style={{ borderTop:'1px solid var(--border)', paddingTop:16, textAlign:'center', color:'var(--text-3)', fontSize:11.5 }}>
            Created by <strong style={{ color:'var(--text-2)' }}>DeepMind E-Systems</strong> · Support: +256 786 747 733
          </footer>
        </main>
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="mbk">
          <div className="mbx" style={{ maxWidth:420 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-h)', fontSize:18, fontWeight:400, color:'var(--text-1)' }}>Add New Employee</h2>
                <p style={{ fontSize:12.5, color:'var(--text-3)', marginTop:2 }}>Fill in the details below</p>
              </div>
              <button onClick={() => { setShowAdd(false); setNeName(''); setNeRole(''); setNePassword(''); }} style={{ background:'var(--surface-3)', border:'none', borderRadius:8, padding:'6px 9px', cursor:'pointer', color:'var(--text-2)' }}>
                <FontAwesomeIcon icon={faTimes} style={{ fontSize:13 }}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Full Name</label>
                <input className="inp" placeholder="e.g. John Mukasa" value={neName} onChange={e => setNeName(e.target.value)} autoComplete="off"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Role</label>
                <input className="inp" placeholder="e.g. Pharmacist, Nurse, Doctor" value={neRole} onChange={e => setNeRole(e.target.value)} autoComplete="off"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>Password</label>
                <input className="inp" type="password" placeholder="Choose a password" value={nePassword} onChange={e => setNePassword(e.target.value)} autoComplete="new-password"/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
              <button className="bg" onClick={() => { setShowAdd(false); setNeName(''); setNeRole(''); setNePassword(''); }}>Cancel</button>
              <button className="bp" onClick={doAdd} disabled={addBusy||!neName||!neRole||!nePassword}>
                {addBusy ? <><FontAwesomeIcon icon={faSpinner} spin/> Adding…</> : <><FontAwesomeIcon icon={faUserPlus} style={{ fontSize:11 }}/> Add Employee</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPerm && selEmp && (
        <div className="mbk">
          <div className="mbx">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-h)', fontSize:18, fontWeight:400, color:'var(--text-1)' }}>Set Permissions</h2>
                <p style={{ fontSize:12.5, color:'var(--text-3)', marginTop:2 }}>{selEmp.Name} · {selEmp.Role}</p>
              </div>
              <button onClick={() => { setShowPerm(false); setPerms(initPerms()); setLcode(''); setSelAll(false); }} style={{ background:'var(--surface-3)', border:'none', borderRadius:8, padding:'6px 9px', cursor:'pointer', color:'var(--text-2)' }}>
                <FontAwesomeIcon icon={faTimes} style={{ fontSize:13 }}/>
              </button>
            </div>
            {permLoad ? (
              <div style={{ padding:'32px 0', textAlign:'center' }}><ClipLoader size={28} color="#2563eb"/></div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
                  <input type="checkbox" id="sa" checked={selAll} onChange={toggleAll} style={{ width:15, height:15, accentColor:'var(--accent)', cursor:'pointer' }}/>
                  <label htmlFor="sa" style={{ fontSize:13, fontWeight:500, color:'var(--text-1)', cursor:'pointer' }}>Select / Deselect All</label>
                </div>
                <div className="emp-scr" style={{ display:'flex', flexDirection:'column', gap:0, maxHeight:280, overflowY:'auto', marginBottom:14 }}>
                  {PERMS.filter(p => isPharm ? p.p : p.c).map(p => (
                    <label key={p.key} className="pc">
                      <input type="checkbox" checked={!!perms[p.key]} onChange={() => setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}/>
                      <span style={{ fontSize:13, color:'var(--text-1)', lineHeight:1.4 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ padding:'14px 16px', background:'var(--surface-3)', borderRadius:'var(--r-md)', marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:'var(--text-2)', marginBottom:6 }}>
                    Individual PIN for {selEmp.Name} <span style={{ color:'var(--text-3)', fontWeight:400 }}>(leave blank to keep current)</span>
                  </label>
                  <input className="inp" type="text" placeholder="e.g. 1234" value={lcode} onChange={e => setLcode(e.target.value)} style={{ background:'var(--surface)' }} autoComplete="off"/>
                </div>
              </>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="bg" onClick={() => { setShowPerm(false); setPerms(initPerms()); setLcode(''); setSelAll(false); }}>Cancel</button>
              <button className="bp" onClick={doPerms} disabled={permBusy||permLoad}>
                {permBusy ? <><FontAwesomeIcon icon={faSpinner} spin/> Saving…</> : <><FontAwesomeIcon icon={faShieldAlt} style={{ fontSize:11 }}/> Update Permissions</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSett     && <SettingsModal          token={token}        onClose={() => setShowSett(false)}/>}
      {showSMS      && <SMSSettingsModal        token={token}        onClose={() => setShowSMS(false)}/>}
      {showInact    && <InactivePatientsModal   token={token}        onClose={() => setShowInact(false)}/>}
      {showDocHeader && (
        <DocumentHeaderModal
          token={sessionToken}
          clinicName={clinicName}
          hasExistingHeader={hasHeader}
          onClose={() => setShowDocHeader(false)}
          addToast={addToast}
        />
      )}
    </>
  );
};

export default AdminDashboard;