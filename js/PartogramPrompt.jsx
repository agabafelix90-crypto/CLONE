import React, { useState, useEffect, useRef } from "react";
import { urls } from "./config.dev";
import FetalHeartGraph from "./FetalHeartGraph";
import LoadingSpinner from './LoadingSpinner';
import VEgraph from './VEgraph';
import MothersVitalsGraph from './MothersVitalsGraph';
import UrineAnalysisGraph from './UrineAnalysisGraph';
import GeneralMotherAssessmentPrompt from './GeneralMotherAssessmentPrompt';
import TreatmentChatModalMaternity from './TreatmentChatModalMaternity';
import PrescriptionPrompt from './PrescriptionPrompt';
import LoadingSpinner2 from './LoadingSpinner2';
import SuccessMessage from './SuccessMessage';

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  navy:    "#0B1E3D",
  teal:    "#0E7C7B",
  tealLt:  "#E6F4F4",
  amber:   "#D97706",
  rose:    "#C0392B",
  green:   "#15803D",
  slate:   "#475569",
  muted:   "#94A3B8",
  border:  "#CBD5E1",
  surface: "#F8FAFC",
  white:   "#FFFFFF",
  low:     "#FEE2E2",
  high:    "#FEF3C7",
  normal:  "#DCFCE7",
};

/* ─── Shared style helpers ───────────────────────────────────── */
const css = {
  card: {
    background: T.white,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: "28px 32px",
    marginBottom: 28,
    boxShadow: "0 1px 4px rgba(11,30,61,.06)",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: T.navy,
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  badge: (color) => ({
    display: "inline-block",
    width: 6,
    height: 22,
    borderRadius: 3,
    background: color,
    flexShrink: 0,
  }),
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: T.slate,
    marginBottom: 6,
    fontFamily: "'DM Sans', sans-serif",
  },
  input: (err) => ({
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${err ? T.rose : T.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: T.navy,
    background: T.white,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    transition: "border-color .15s",
  }),
  select: (err) => ({
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${err ? T.rose : T.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: T.navy,
    background: T.white,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  }),
  textarea: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${T.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: T.navy,
    background: T.white,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    resize: "vertical",
    minHeight: 90,
    boxSizing: "border-box",
  },
  errorMsg: {
    color: T.rose,
    fontSize: 11,
    marginTop: 4,
    fontFamily: "'DM Sans', sans-serif",
  },
  btnPrimary: {
    padding: "10px 20px",
    background: T.teal,
    color: T.white,
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.04em",
    transition: "background .15s",
  },
  btnSecondary: {
    padding: "10px 20px",
    background: T.white,
    color: T.navy,
    border: `1.5px solid ${T.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.04em",
  },
  btnDanger: {
    padding: "10px 20px",
    background: T.rose,
    color: T.white,
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  btnSuccess: {
    padding: "10px 20px",
    background: T.green,
    color: T.white,
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.04em",
  },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: T.slate,
    background: T.surface,
    borderBottom: `2px solid ${T.border}`,
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 14px",
    fontSize: 13,
    color: T.navy,
    borderBottom: `1px solid ${T.border}`,
    fontFamily: "'DM Sans', sans-serif",
  },
  pill: (type) => {
    const map = { Low: [T.low, T.rose], High: [T.high, T.amber], Normal: [T.normal, T.green] };
    const [bg, col] = map[type] || [T.surface, T.slate];
    return { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color: col, fontFamily: "'DM Sans', sans-serif" };
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
    marginTop: 16,
  },
  divider: { borderTop: `1px solid ${T.border}`, margin: "22px 0" },
  hint: { fontSize: 11, color: T.muted, marginTop: 4, fontFamily: "'DM Sans', sans-serif" },
};

/* ─── Field wrapper ──────────────────────────────────────────── */
const Field = ({ label, error, hint, children, full }) => (
  <div style={full ? { gridColumn: "1 / -1" } : {}}>
    {label && <label style={css.label}>{label}</label>}
    {children}
    {hint && !error && <div style={css.hint}>{hint}</div>}
    {error && <div style={css.errorMsg}>⚠ {error}</div>}
  </div>
);

/* ─── Collapsible form panel ─────────────────────────────────── */
const FormPanel = ({ open, onToggle, toggleLabel, children }) => (
  <div style={{ marginTop: 20 }}>
    <button style={open ? css.btnSecondary : css.btnPrimary} onClick={onToggle}>
      {open ? `▲ ${toggleLabel} ` : `＋ ${toggleLabel}`}
    </button>
    {open && (
      <div style={{
        marginTop: 16,
        padding: "20px 24px",
        background: T.surface,
        borderRadius: 10,
        border: `1px solid ${T.border}`,
      }}>
        {children}
      </div>
    )}
  </div>
);

/* ─── Status pill ────────────────────────────────────────────── */
const StatusPill = ({ low, high }) => {
  const label = low ? "Low" : high ? "High" : "Normal";
  return <span style={css.pill(label)}>{label}</span>;
};

/* ─── Validation helpers ─────────────────────────────────────── */
const validateBP = (v) => {
  if (!v) return "Blood pressure is required.";
  if (!/^\d{2,3}\/\d{2,3}$/.test(v.trim())) return "Enter as systolic/diastolic (e.g. 120/80) — no spaces or units.";
  const [sys, dia] = v.split("/").map(Number);
  if (sys < 60 || sys > 250) return "Systolic must be between 60 and 250.";
  if (dia < 30 || dia > 150) return "Diastolic must be between 30 and 150.";
  return "";
};
const validateSpo2 = (v) => {
  if (!v) return "SpO₂ is required.";
  const n = Number(v);
  if (isNaN(n) || n < 50 || n > 100) return "SpO₂ must be a percentage between 50 and 100.";
  return "";
};
const validatePulse = (v) => {
  if (!v) return "Pulse is required.";
  const n = Number(v);
  if (isNaN(n) || n < 20 || n > 300) return "Pulse (bpm) must be between 20 and 300.";
  return "";
};
const validateTemp = (v) => {
  if (!v) return "Temperature is required.";
  const n = Number(v);
  if (isNaN(n) || n < 30 || n > 45) return "Temperature (°C) must be between 30 and 45.";
  return "";
};
const validateHR = (v) => {
  if (!v) return "Heart rate is required.";
  const n = Number(v);
  if (isNaN(n) || n < 50 || n > 220) return "Fetal heart rate must be 50–220 bpm.";
  return "";
};
const validateDilation = (v) => {
  if (v === "" || v === undefined) return "Dilation is required.";
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 10) return "Dilation must be a whole number 0–10 cm.";
  return "";
};
const validateDescent = (v) => {
  if (v === "" || v === undefined) return "Descent is required.";
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 7) return "Descent must be a whole number 0–7.";
  return "";
};
const validateRequired = (v, name) => (!v ? `${name} is required.` : "");
const validateVolume = (v) => {
  if (!v) return "Volume is required.";
  const n = Number(v);
  if (isNaN(n) || n < 0 || n > 5000) return "Volume must be between 0 and 5000 ml.";
  return "";
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const LaborProgressTracker = ({
  first_name, last_name, age, address, phone_number,
  clinicName, employeeName, maternity_id, status, tokenFromUrl, onClose
}) => {

  /* ── Core data state ── */
  const [laborData, setLaborData] = useState({
    fetalMonitoring: { entries: [], date: '', time: '', heartRate: '' },
    cervicalDilation: { entries: [], date: '', time: '', dilation: '', descent: '', membranes: '', liquor: '', moulding: '' },
    contractions:    { entries: [], date: '', time: '' },
    mothersVitals:   { entries: [], date: '', time: '', bloodPressure: '', spo2: '', pulse: '', temperature: '' },
  });
  const [urineData, setUrineData] = useState({ entries: [], date: '', time: '', volume: '', color: '', odor: '', remarks: '' });
  const [maternalData, setMaternalData] = useState({
    name: '', age: '', lnmp: '', dateOfAdmission: '', timeOfAdmission: '',
    gravida: '', para: '', weeksOfGestation: '', membranesRupturedAt: '', riskFactors: '',
  });
  const [addEntryState, setAddEntryState] = useState({
    isVisible: false, date: '', time: '', numberOfContractions: '', volume: '', color: '', odor: '', remarks: '',
    duration1: '', strength1: '', duration2: '', strength2: '',
    duration3: '', strength3: '', duration4: '', strength4: '',
  });

  /* ── UI toggles ── */
  const [showAddEntryTools, setShowAddEntryTools]                   = useState(false);
  const [showAddVitalsTools, setShowAddVitalsTools]                 = useState(false);
  const [showFetalMonitoringEntryTools, setShowFetalMonitoringEntryTools] = useState(false);
  const [showGraphModal, setShowGraphModal]                         = useState(false);
  const [showVEGraphModal, setShowVEGraphModal]                     = useState(false);
  const [showMothersVitalsGraph, setShowMothersVitalsGraph]         = useState(false);
  const [showUrineAnalysisGraph, setShowUrineAnalysisGraph]         = useState(false);
  const [showPrompt, setShowPrompt]                                 = useState(false);
  const [showTreatmentChatModal, setShowTreatmentChatModal]         = useState(false);
  const [showPrescriptionPrompt, setShowPrescriptionPrompt]         = useState(false);
  const [isEditingComments, setIsEditingComments]                   = useState(false);

  /* ── Validation errors ── */
  const [fhrErrors, setFhrErrors]       = useState({});
  const [veErrors, setVeErrors]         = useState({});
  const [vitalsErrors, setVitalsErrors] = useState({});
  const [urineErrors, setUrineErrors]   = useState({});

  /* ── Async state ── */
  const [loading, setLoading]   = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError]       = useState(null);
  const [treatmentData, setTreatmentData] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [comments, setComments] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const treatmentChatModalRef = useRef(null);

  const flash = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleInputChange = (section, key, value) => {
    setLaborData(p => ({ ...p, [section]: { ...p[section], [key]: value } }));
  };

  const getIntensity = (d) => {
    const n = Number(d);
    if (n < 20) return "Mild";
    if (n <= 40) return "Moderate";
    return "Strong";
  };

  /* ── Fetch effects ── */
  useEffect(() => {
    const go = async () => {
      try {
        setLoading(true);
        const r = await fetch(urls.fetchLabourFetalVitals, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) });
        if (r.ok) {
          const res = await r.json();
          if (res?.entries) {
            const p = res.entries.map(e => ({ ...e, lowHeartRate: Number(e.heartRate) < 110, highHeartRate: Number(e.heartRate) > 160 }));
            setLaborData(prev => ({ ...prev, fetalMonitoring: { ...prev.fetalMonitoring, entries: p } }));
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    go();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(urls.fetchlabourdilatationdata, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) });
        if (r.ok) { const d = await r.json(); if (d?.entries) setLaborData(p => ({ ...p, cervicalDilation: { ...p.cervicalDilation, entries: d.entries } })); }
      } catch (e) { console.error(e); }
    };
    go();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(urls.fetchlabourcontractionsdata, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) });
        if (r.ok) {
          const data = await r.json();
          if (data?.entries) {
            const t = data.entries.map(e => ({
              date: e.date, time: e.time, numberOfContractions: e.num_contractions,
              contractions: [
                { duration: e.duration1, intensity: e.strength1 }, { duration: e.duration2, intensity: e.strength2 },
                { duration: e.duration3, intensity: e.strength3 }, { duration: e.duration4, intensity: e.strength4 },
              ].filter(c => c.duration && c.intensity),
            }));
            setLaborData(p => ({ ...p, contractions: { ...p.contractions, entries: t } }));
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    go();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(urls.fetchlabourmothersvitals, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) });
        if (r.ok) { const d = await r.json(); if (d?.entries) setLaborData(p => ({ ...p, mothersVitals: { ...p.mothersVitals, entries: d.entries } })); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    go();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(urls.fetchurinedata, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) });
        if (r.ok) {
          const data = await r.json();
          if (data?.entries) {
            setUrineData(p => ({ ...p, entries: data.entries.map(e => ({ date: new Date(e.date).toLocaleDateString(), time: e.time, volume: e.urineVolume, color: e.urineColor, odor: e.urineOdor, remarks: e.remarks || "N/A" })) }));
          }
        }
      } catch (e) { console.error(e); }
    };
    go();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [commR, presR, treatR] = await Promise.all([
          fetch(urls.fetchmaternitycomments, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id }) }),
          fetch(urls.fetchmaternityprescriptions, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id }) }),
          fetch(urls.fetchMaternityTreatment, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl }) }),
        ]);
        if (commR.ok) { const d = await commR.json(); setComments(d?.comments?.[0]?.comments || ''); }
        if (presR.ok) { const d = await presR.json(); setPrescriptions((d?.treatmentplans || []).map(p => p.replace(/\u2022/g, "•"))); }
        if (treatR.ok) {
          const d = await treatR.json();
          if (d?.entries) setTreatmentData(d.entries.map(e => ({ date: new Date(e.date).toLocaleDateString(), treatment: e.treatment || "N/A" })));
          if (d?.treatment_plan) setTreatmentPlan(d.treatment_plan);
        }
      } catch (e) { console.error(e); setError("Unable to fetch data."); } finally { setLoading(false); }
    };
    fetchAll();
  }, [maternity_id, tokenFromUrl]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(urls.fetchlabourdetails, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id }) });
        const data = await r.json();
        if (data) setMaternalData({ name: data.name || '', age: data.age || '', lnmp: data.lnmp || '', dateOfAdmission: data.dateOfAdmission || '', timeOfAdmission: data.timeOfAdmission || '', gravida: data.gravida || '', para: data.para || '', weeksOfGestation: data.weeksOfGestation || '', membranesRupturedAt: data.membranesRupturedAt || '', riskFactors: data.riskFactors || '' });
      } catch (e) { console.error(e); }
    };
    go();
  }, []);

  /* ── Submit handlers ── */
  const addFetalHeartRateEntry = async () => {
    const { date, time, heartRate } = laborData.fetalMonitoring;
    const errs = {
      date: validateRequired(date, "Date"),
      time: validateRequired(time, "Time"),
      heartRate: validateHR(heartRate),
    };
    setFhrErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setIsLoading(true);
    try {
      const r = await fetch(urls.AddFetalHeart, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl, date, time, heartRate }) });
      if (!r.ok) throw new Error();
      const hr = Number(heartRate);
      setLaborData(p => ({ ...p, fetalMonitoring: { ...p.fetalMonitoring, entries: [...p.fetalMonitoring.entries, { date, time, heartRate: hr, lowHeartRate: hr < 110, highHeartRate: hr > 160 }], date: '', time: '', heartRate: '' } }));
      setShowFetalMonitoringEntryTools(false);
      flash();
    } catch { alert('Failed to add entry. Please try again.'); } finally { setIsLoading(false); }
  };

  const addCervicalDilationEntry = async () => {
    const { date, time, dilation, descent, membranes, liquor, moulding } = laborData.cervicalDilation;
    const errs = {
      date: validateRequired(date, "Date"),
      time: validateRequired(time, "Time"),
      dilation: validateDilation(dilation),
      descent: validateDescent(descent),
      membranes: validateRequired(membranes, "Membranes status"),
      liquor: membranes === "Raptured" ? validateRequired(liquor, "Liquor") : "",
      moulding: membranes === "Raptured" ? validateRequired(moulding, "Moulding") : "",
    };
    setVeErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setIsLoading(true);
    try {
      const r = await fetch(urls.AddCervicalDilation, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl, date, time, dilation: Number(dilation), descent: Number(descent), membranes, liquor, moulding }) });
      if (!r.ok) throw new Error();
      setLaborData(p => ({ ...p, cervicalDilation: { ...p.cervicalDilation, entries: [...p.cervicalDilation.entries, { date, time, dilation: Number(dilation), descent: Number(descent), membranes, liquor, moulding }], date: '', time: '', dilation: '', descent: '', membranes: '', liquor: '', moulding: '' } }));
      setShowAddEntryTools(false);
      flash();
    } catch { alert('Failed to add entry. Please try again.'); } finally { setIsLoading(false); }
  };

  const addContractionEntry = async () => {
    const { date, time, numberOfContractions } = addEntryState;
    if (!date || !time || !numberOfContractions) { alert("Please fill in date, time, and number of contractions."); return; }
    setIsLoading(true);
    try {
      const r = await fetch(urls.AddContraction, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl, date, time, numberOfContractions, ...addEntryState }) });
      if (!r.ok) throw new Error(await r.text());
      const n = Number(numberOfContractions);
      const contractions = Array.from({ length: n }, (_, i) => ({ duration: addEntryState[`duration${i+1}`], intensity: addEntryState[`strength${i+1}`] }));
      setLaborData(p => ({ ...p, contractions: { ...p.contractions, entries: [...p.contractions.entries, { date, time, numberOfContractions: n, contractions }] } }));
      setAddEntryState(p => ({ ...p, isVisible: false, date: '', time: '', numberOfContractions: '', duration1: '', strength1: '', duration2: '', strength2: '', duration3: '', strength3: '', duration4: '', strength4: '' }));
      flash();
    } catch (e) { alert(`Failed: ${e.message}`); } finally { setIsLoading(false); }
  };

  const addMothersVitalsEntry = async () => {
    const { date, time, bloodPressure, spo2, pulse, temperature } = laborData.mothersVitals;
    const errs = {
      date: validateRequired(date, "Date"),
      time: validateRequired(time, "Time"),
      bloodPressure: validateBP(bloodPressure),
      spo2: validateSpo2(spo2),
      pulse: validatePulse(pulse),
      temperature: validateTemp(temperature),
    };
    setVitalsErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setIsLoading(true);
    try {
      const r = await fetch(urls.AddMothersVitals, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl, date, time, bloodPressure, spo2, pulse, temperature }) });
      if (!r.ok) throw new Error();
      setLaborData(p => ({ ...p, mothersVitals: { ...p.mothersVitals, entries: [...p.mothersVitals.entries, { date, time, bloodPressure, spo2, pulse, temperature }], date: '', time: '', bloodPressure: '', spo2: '', pulse: '', temperature: '' } }));
      setShowAddVitalsTools(false);
      flash();
    } catch { alert('Failed to add vitals. Check blood pressure format (120/80) and network connection.'); } finally { setIsLoading(false); }
  };

  const addUrineEntry = async () => {
    const { date, time, volume, color, odor, remarks } = addEntryState;
    const errs = {
      date: validateRequired(date, "Date"),
      time: validateRequired(time, "Time"),
      volume: validateVolume(volume),
      color: validateRequired(color, "Color"),
      odor: validateRequired(odor, "Odor"),
      remarks: validateRequired(remarks, "Remarks"),
    };
    setUrineErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setIsLoading(true);
    try {
      const r = await fetch(urls.AddUrineData, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maternity_id, token: tokenFromUrl, date, time, urineVolume: volume, urineColor: color, urineOdor: odor, remarks }) });
      if (!r.ok) throw new Error('Failed to add urine entry. Check date/time ordering or network.');
      const res = await r.json();
      if (res.error === "New data must be later than the existing entry") { alert('Date/time must be after the last entry.'); return; }
      setUrineData(p => ({ ...p, entries: [...p.entries, { date, time, volume, color, odor, remarks }] }));
      setAddEntryState(p => ({ ...p, isVisible: false, date: '', time: '', volume: '', color: '', odor: '', remarks: '' }));
      flash();
    } catch (e) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const r = await fetch(urls.labourdetails, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...maternalData, maternity_id }) });
      const res = await r.json();
      if (res.message === 'Data inserted successfully') { flash(); } else { alert('Failed to submit maternal details.'); }
    } catch { alert('Error submitting. Please try again.'); } finally { setIsLoading(false); }
  };

  const handleUpdateComments = async () => {
    setIsLoading(true);
    try {
      const r = await fetch(urls.updatematernitycomments, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ maternity_id, comments }) });
      const data = await r.json();
      if (data.message === "Comment added successfully") { setIsEditingComments(false); flash(); } else { alert('Error updating notes.'); }
    } catch { alert('Network error.'); } finally { setIsLoading(false); }
  };

  /* ── Vitals colour ── */
  const getVitalBg = (vital, value) => {
    if (!value) return {};
    switch (vital) {
      case "bloodPressure": {
        const [s, d] = value.split("/").map(Number);
        if (s < 90 || d < 60) return { background: T.low };
        if (s > 140 || d > 90) return { background: T.high };
        return { background: T.normal };
      }
      case "spo2": return Number(value) < 90 ? { background: T.low } : { background: T.normal };
      case "pulse": {
        const n = Number(value);
        if (n < 60) return { background: T.low };
        if (n > 100) return { background: T.high };
        return { background: T.normal };
      }
      case "temperature": {
        const n = Number(value);
        if (n < 36) return { background: T.low };
        if (n > 37.5) return { background: T.high };
        return { background: T.normal };
      }
      default: return {};
    }
  };

  /* ── Empty state ── */
  const EmptyState = ({ msg }) => (
    <div style={{ textAlign: "center", padding: "32px 0", color: T.muted, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>—</div>
      {msg}
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>

      <div style={{ position: "fixed", inset: 0, background: "rgba(11,30,61,.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: 0 }}>
        <div style={{ background: T.surface, width: "100%", minHeight: "100vh", borderRadius: 0, boxShadow: "none", position: "relative", paddingBottom: 40 }}>

          {isLoading && <LoadingSpinner2 />}
          {isSuccess && <SuccessMessage />}

          {/* ── Header ── */}
          <div style={{ background: T.navy, borderRadius: 0, padding: "28px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Labor Progress Tracker</div>
              <h1 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 26, color: T.white, fontWeight: 400 }}>{first_name} {last_name}</h1>
              {age && <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Age {age} · {clinicName}</div>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.12)", border: "none", color: T.white, width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ padding: "28px 36px" }}>

            {/* ══════════════════════════════════════════════
                MATERNAL INFORMATION
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={css.sectionTitle}><span style={css.badge(T.rose)} />Maternal Information</div>
              <div style={css.formGrid}>
                {[
                  { key: 'name',               label: 'Full Name',               placeholder: 'e.g. Jane Nakato' },
                  { key: 'age',                label: 'Age',                     placeholder: 'e.g. 28' },
                  { key: 'lnmp',               label: 'LNMP',                    placeholder: 'YYYY-MM-DD' },
                  { key: 'dateOfAdmission',    label: 'Date of Admission',       placeholder: 'YYYY-MM-DD' },
                  { key: 'timeOfAdmission',    label: 'Time of Admission',       placeholder: 'HH:MM (24-hr)' },
                  { key: 'gravida',            label: 'Gravida',                 placeholder: 'e.g. 2' },
                  { key: 'para',               label: 'Para',                    placeholder: 'e.g. 1' },
                  { key: 'weeksOfGestation',   label: 'Weeks of Gestation',      placeholder: 'e.g. 38' },
                  { key: 'membranesRupturedAt',label: 'Membranes Ruptured At',   placeholder: 'YYYY-MM-DD HH:MM' },
                ].map(({ key, label, placeholder }) => (
                  <Field key={key} label={label}>
                    <input style={css.input(false)} placeholder={placeholder} value={maternalData[key]} onChange={e => setMaternalData(p => ({ ...p, [key]: e.target.value }))} />
                  </Field>
                ))}
                <Field label="Risk Factors" full>
                  <textarea style={css.textarea} placeholder="Describe any identified risk factors (e.g. gestational hypertension, previous C-section)" value={maternalData.riskFactors} onChange={e => setMaternalData(p => ({ ...p, riskFactors: e.target.value }))} />
                </Field>
              </div>
              <div style={{ marginTop: 20 }}>
                <button style={css.btnPrimary} onClick={handleSubmit}>Confirm Maternal Details</button>
              </div>
          
          
            </div>

            {/* ══════════════════════════════════════════════
                FETAL MONITORING
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={css.sectionTitle}><span style={css.badge(T.teal)} />Fetal Heart Rate Monitoring</div>
                <button style={{ ...css.btnSuccess, fontSize: 12 }} onClick={() => setShowGraphModal(true)}>📊 View Graph</button>
              </div>

              {loading ? <LoadingSpinner /> : laborData.fetalMonitoring.entries.length === 0 ? <EmptyState msg="No fetal heart rate entries recorded yet." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Time","Heart Rate (bpm)","Status"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {laborData.fetalMonitoring.entries.map((e, i) => (
                        <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                          <td style={css.td}>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                          <td style={css.td}>{e.time}</td>
                          <td style={css.td}><strong>{e.heartRate}</strong></td>
                          <td style={{ ...css.td }}><StatusPill low={e.lowHeartRate} high={e.highHeartRate} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <FormPanel open={showFetalMonitoringEntryTools} onToggle={() => setShowFetalMonitoringEntryTools(p => !p)} toggleLabel="Add FHR Entry">
                <div style={css.formGrid}>
                  <Field label="Date" error={fhrErrors.date}>
                    <input type="date" style={css.input(fhrErrors.date)} value={laborData.fetalMonitoring.date} onChange={e => { handleInputChange('fetalMonitoring','date',e.target.value); setFhrErrors(p=>({...p,date:''})); }} />
                  </Field>
                  <Field label="Time" error={fhrErrors.time}>
                    <input type="time" style={css.input(fhrErrors.time)} value={laborData.fetalMonitoring.time} onChange={e => { handleInputChange('fetalMonitoring','time',e.target.value); setFhrErrors(p=>({...p,time:''})); }} />
                  </Field>
                  <Field label="Fetal Heart Rate" error={fhrErrors.heartRate} hint="Normal range: 110–160 bpm">
                    <input type="number" placeholder="e.g. 140  (bpm — numbers only)" style={css.input(fhrErrors.heartRate)} value={laborData.fetalMonitoring.heartRate} onChange={e => { handleInputChange('fetalMonitoring','heartRate',e.target.value); setFhrErrors(p=>({...p,heartRate:''})); }} />
                  </Field>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button style={css.btnSuccess} onClick={addFetalHeartRateEntry}>Save Entry</button>
                </div>
              </FormPanel>

              {showGraphModal && <FetalHeartGraph entries={laborData.fetalMonitoring.entries} onClose={() => setShowGraphModal(false)} />}
            </div>

            {/* ══════════════════════════════════════════════
                CERVICAL DILATION
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={css.sectionTitle}><span style={css.badge(T.amber)} />Cervical Dilation (VE)</div>
                <button style={{ ...css.btnSuccess, fontSize: 12 }} onClick={() => setShowVEGraphModal(true)}>📊 View Graph</button>
              </div>

              {loading ? <LoadingSpinner /> : laborData.cervicalDilation.entries.length === 0 ? <EmptyState msg="No cervical dilation data recorded yet." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Time","Dilation (cm)","Descent","Membranes","Liquor","Moulding"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {laborData.cervicalDilation.entries.map((e, i) => (
                        <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                          <td style={css.td}>{new Date(e.date).toISOString().split('T')[0]}</td>
                          <td style={css.td}>{e.time}</td>
                          <td style={css.td}><strong>{e.dilation} cm</strong></td>
                          <td style={css.td}>{e.descent}</td>
                          <td style={css.td}>{e.membranes}</td>
                          <td style={css.td}>{e.membranes==="Raptured"?e.liquor:'—'}</td>
                          <td style={css.td}>{e.membranes==="Raptured"?e.moulding:'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <FormPanel open={showAddEntryTools} onToggle={() => setShowAddEntryTools(p => !p)} toggleLabel="Add VE Results">
                <div style={css.formGrid}>
                  <Field label="Date" error={veErrors.date}>
                    <input type="date" style={css.input(veErrors.date)} value={laborData.cervicalDilation.date} onChange={e => { handleInputChange('cervicalDilation','date',e.target.value); setVeErrors(p=>({...p,date:''})); }} />
                  </Field>
                  <Field label="Time" error={veErrors.time}>
                    <input type="time" style={css.input(veErrors.time)} value={laborData.cervicalDilation.time} onChange={e => { handleInputChange('cervicalDilation','time',e.target.value); setVeErrors(p=>({...p,time:''})); }} />
                  </Field>
                  <Field label="Cervical Dilation" error={veErrors.dilation} hint="Whole number, 0–10 cm">
                    <input type="number" placeholder="e.g. 5  (whole number, 0–10 cm)" style={css.input(veErrors.dilation)} value={laborData.cervicalDilation.dilation} onChange={e => { handleInputChange('cervicalDilation','dilation',e.target.value); setVeErrors(p=>({...p,dilation:''})); }} />
                  </Field>
                  <Field label="Descent of Head" error={veErrors.descent} hint="Whole number, 0–7 (fifths above brim)">
                    <input type="number" placeholder="e.g. 3  (0–7 fifths)" style={css.input(veErrors.descent)} value={laborData.cervicalDilation.descent} onChange={e => { handleInputChange('cervicalDilation','descent',e.target.value); setVeErrors(p=>({...p,descent:''})); }} />
                  </Field>
                  <Field label="Membranes" error={veErrors.membranes}>
                    <select style={css.select(veErrors.membranes)} value={laborData.cervicalDilation.membranes} onChange={e => { handleInputChange('cervicalDilation','membranes',e.target.value); setVeErrors(p=>({...p,membranes:''})); }}>
                      <option value="">Select status</option>
                      <option value="Intact">Intact</option>
                      <option value="Raptured">Ruptured</option>
                    </select>
                  </Field>
                  {laborData.cervicalDilation.membranes === "Raptured" && <>
                    <Field label="Liquor" error={veErrors.liquor}>
                      <input style={css.input(veErrors.liquor)} placeholder="e.g. Clear, Meconium-stained" value={laborData.cervicalDilation.liquor} onChange={e => { handleInputChange('cervicalDilation','liquor',e.target.value); setVeErrors(p=>({...p,liquor:''})); }} />
                    </Field>
                    <Field label="Moulding" error={veErrors.moulding}>
                      <input style={css.input(veErrors.moulding)} placeholder="e.g. Absent, Grade 1, Grade 2" value={laborData.cervicalDilation.moulding} onChange={e => { handleInputChange('cervicalDilation','moulding',e.target.value); setVeErrors(p=>({...p,moulding:''})); }} />
                    </Field>
                  </>}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button style={css.btnSuccess} onClick={addCervicalDilationEntry}>Save VE Entry</button>
                </div>
              </FormPanel>

              {showVEGraphModal && <VEgraph entries={laborData.cervicalDilation.entries.map(e => ({ ...e, date: new Date(e.date).toISOString().split('T')[0] }))} onClose={() => setShowVEGraphModal(false)} />}
            </div>

            {/* ══════════════════════════════════════════════
                CONTRACTIONS
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={css.sectionTitle}><span style={css.badge(T.teal)} />Contractions</div>

              {loading ? <LoadingSpinner /> : laborData.contractions.entries.length === 0 ? <EmptyState msg="No contraction data recorded yet." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Time Window","Count","Contraction 1","Contraction 2","Contraction 3","Contraction 4"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {laborData.contractions.entries.map((entry, i) => {
                        const t = new Date(`1970-01-01T${entry.time}:00Z`);
                        const t2 = new Date(t.getTime() + 600000);
                        const fmt = d => `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
                        return (
                          <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                            <td style={css.td}>{entry.date}</td>
                            <td style={css.td}>{fmt(t)} – {fmt(t2)}</td>
                            <td style={css.td}>{entry.numberOfContractions} {entry.numberOfContractions === 1 ? "contraction" : "contractions"}</td>
                            {Array.from({ length: 4 }, (_, ci) => {
                              const c = entry.contractions[ci];
                              if (c) {
                                const intensity = c.intensity?.toLowerCase();
                                const bg = intensity === "mild" ? "#a8d08d" : intensity === "moderate" ? "#ffeb3b" : "#f44336";
                                const col = intensity === "mild" ? "#1a4a1a" : intensity === "moderate" ? "#5a4000" : "#fff";
                                return (
                                  <td key={ci} style={{ ...css.td, backgroundColor: bg, color: col, verticalAlign: "top" }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>Contraction {ci+1}</div>
                                    <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}><strong>Duration:</strong> {c.duration}s</div>
                                    <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}><strong>Intensity:</strong> {c.intensity}</div>
                                  </td>
                                );
                              }
                              return <td key={ci} style={{ ...css.td, backgroundColor: "#1a1a1a" }} />;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <FormPanel open={addEntryState.isVisible} onToggle={() => setAddEntryState(p => ({ ...p, isVisible: !p.isVisible }))} toggleLabel="Add Contraction Entry">
                <div style={css.formGrid}>
                  <Field label="Date">
                    <input type="date" style={css.input(false)} value={addEntryState.date} onChange={e => setAddEntryState(p => ({ ...p, date: e.target.value }))} />
                  </Field>
                  <Field label="Start Time">
                    <input type="time" style={css.input(false)} value={addEntryState.time} onChange={e => setAddEntryState(p => ({ ...p, time: e.target.value }))} />
                  </Field>
                  <Field label="Number of Contractions" full>
                    <select style={css.select(false)} value={addEntryState.numberOfContractions} onChange={e => setAddEntryState(p => ({ ...p, numberOfContractions: e.target.value }))}>
                      <option value="">Select count</option>
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                </div>
                {Number(addEntryState.numberOfContractions) > 0 && (
                  <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 }}>
                    {Array.from({ length: Number(addEntryState.numberOfContractions) }, (_, ci) => (
                      <div key={ci} style={{ background: T.surface, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.slate, fontFamily: "'DM Sans', sans-serif", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Contraction {ci+1}</div>
                        <Field label="Duration" hint="Determines intensity automatically">
                          <input type="number" placeholder="e.g. 35  (seconds — numbers only)" style={css.input(false)} value={addEntryState[`duration${ci+1}`]||''} onChange={e => { const d = e.target.value; setAddEntryState(p => ({ ...p, [`duration${ci+1}`]: d, [`strength${ci+1}`]: getIntensity(d) })); }} />
                        </Field>
                        {addEntryState[`duration${ci+1}`] && (
                          <div style={{ marginTop: 8 }}>
                            <span style={css.pill(addEntryState[`strength${ci+1}`] === "Mild" ? "Normal" : addEntryState[`strength${ci+1}`] === "Strong" ? "Low" : "High")}>
                              {addEntryState[`strength${ci+1}`]}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <button style={css.btnSuccess} onClick={addContractionEntry}>Save Contractions</button>
                </div>
              </FormPanel>
            </div>

            {/* ══════════════════════════════════════════════
                MOTHER'S VITALS
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={css.sectionTitle}><span style={css.badge(T.amber)} />Mother's Vitals</div>
                <button style={{ ...css.btnSuccess, fontSize: 12 }} onClick={() => setShowMothersVitalsGraph(true)}>📊 View Graph</button>
              </div>

              {loading ? <LoadingSpinner /> : laborData.mothersVitals.entries.length === 0 ? <EmptyState msg="No vital signs recorded yet." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Time","Blood Pressure","SpO₂ (%)","Pulse (bpm)","Temp (°C)"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {laborData.mothersVitals.entries.map((e, i) => (
                        <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                          <td style={css.td}>{e.date}</td>
                          <td style={css.td}>{e.time}</td>
                          <td style={{ ...css.td, ...getVitalBg('bloodPressure', e.bloodPressure) }}>{e.bloodPressure}</td>
                          <td style={{ ...css.td, ...getVitalBg('spo2', e.spo2) }}>{e.spo2}%</td>
                          <td style={{ ...css.td, ...getVitalBg('pulse', e.pulse) }}>{e.pulse}</td>
                          <td style={{ ...css.td, ...getVitalBg('temperature', e.temperature) }}>{e.temperature} °C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <FormPanel open={showAddVitalsTools} onToggle={() => setShowAddVitalsTools(p => !p)} toggleLabel="Add Vitals Entry">
                <div style={css.formGrid}>
                  <Field label="Date" error={vitalsErrors.date}>
                    <input type="date" style={css.input(vitalsErrors.date)} value={laborData.mothersVitals.date} onChange={e => { handleInputChange('mothersVitals','date',e.target.value); setVitalsErrors(p=>({...p,date:''})); }} />
                  </Field>
                  <Field label="Time" error={vitalsErrors.time}>
                    <input type="time" style={css.input(vitalsErrors.time)} value={laborData.mothersVitals.time} onChange={e => { handleInputChange('mothersVitals','time',e.target.value); setVitalsErrors(p=>({...p,time:''})); }} />
                  </Field>
                  <Field label="Blood Pressure" error={vitalsErrors.bloodPressure} hint="Format: systolic/diastolic — no spaces or units">
                    <input style={css.input(vitalsErrors.bloodPressure)} placeholder="e.g. 120/80  (mmHg — no spaces, no units)" value={laborData.mothersVitals.bloodPressure} onChange={e => { handleInputChange('mothersVitals','bloodPressure',e.target.value.replace(/\s/g,'')); setVitalsErrors(p=>({...p,bloodPressure:''})); }} />
                  </Field>
                  <Field label="SpO₂" error={vitalsErrors.spo2} hint="Enter percentage value only (50–100)">
                    <input type="number" placeholder="e.g. 98  (% — numbers only, no % symbol)" style={css.input(vitalsErrors.spo2)} value={laborData.mothersVitals.spo2} onChange={e => { handleInputChange('mothersVitals','spo2',e.target.value); setVitalsErrors(p=>({...p,spo2:''})); }} />
                  </Field>
                  <Field label="Pulse" error={vitalsErrors.pulse} hint="Beats per minute">
                    <input type="number" placeholder="e.g. 78  (bpm — numbers only)" style={css.input(vitalsErrors.pulse)} value={laborData.mothersVitals.pulse} onChange={e => { handleInputChange('mothersVitals','pulse',e.target.value); setVitalsErrors(p=>({...p,pulse:''})); }} />
                  </Field>
                  <Field label="Temperature" error={vitalsErrors.temperature} hint="Degrees Celsius (normal: 36.1–37.2 °C)">
                    <input type="number" step="0.1" placeholder="e.g. 36.8  (°C — numbers only, no units)" style={css.input(vitalsErrors.temperature)} value={laborData.mothersVitals.temperature} onChange={e => { handleInputChange('mothersVitals','temperature',e.target.value); setVitalsErrors(p=>({...p,temperature:''})); }} />
                  </Field>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button style={css.btnSuccess} onClick={addMothersVitalsEntry}>Save Vitals</button>
                </div>
              </FormPanel>

              {showMothersVitalsGraph && <MothersVitalsGraph entries={laborData.mothersVitals.entries} onClose={() => setShowMothersVitalsGraph(false)} />}
            </div>

            {/* ══════════════════════════════════════════════
                URINE OUTPUT & ANALYSIS
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={css.sectionTitle}><span style={css.badge(T.teal)} />Urine Output &amp; Analysis</div>
                <button style={{ ...css.btnSuccess, fontSize: 12 }} onClick={() => setShowUrineAnalysisGraph(true)}>📊 View Graph</button>
              </div>

              {loading ? <LoadingSpinner /> : urineData.entries.length === 0 ? <EmptyState msg="No urine analysis entries yet." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Time","Volume (ml)","Color","Odor","Remarks"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {urineData.entries.map((e, i) => {
                        const colorBg = { red:"#FEE2E2", amber:"#FEF3C7", "dark yellow":"#FDE68A", "pale yellow":"#FEFCE8", clear:T.white }[e.color?.toLowerCase()] || T.surface;
                        return (
                          <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                            <td style={css.td}>{e.date}</td>
                            <td style={css.td}>{e.time}</td>
                            <td style={css.td}>{e.volume} ml</td>
                            <td style={{ ...css.td, background: colorBg }}>{e.color}</td>
                            <td style={css.td}>{e.odor}</td>
                            <td style={css.td}>{e.remarks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <FormPanel open={addEntryState.isVisible} onToggle={() => setAddEntryState(p => ({ ...p, isVisible: !p.isVisible }))} toggleLabel="Add Urine Entry">
                <div style={css.formGrid}>
                  <Field label="Date" error={urineErrors.date}>
                    <input type="date" style={css.input(urineErrors.date)} value={addEntryState.date} onChange={e => { setAddEntryState(p => ({ ...p, date: e.target.value })); setUrineErrors(p=>({...p,date:''})); }} />
                  </Field>
                  <Field label="Time" error={urineErrors.time}>
                    <input type="time" style={css.input(urineErrors.time)} value={addEntryState.time} onChange={e => { setAddEntryState(p => ({ ...p, time: e.target.value })); setUrineErrors(p=>({...p,time:''})); }} />
                  </Field>
                  <Field label="Volume" error={urineErrors.volume} hint="Millilitres (ml)">
                    <input type="number" placeholder="e.g. 250  (ml — numbers only, no units)" style={css.input(urineErrors.volume)} value={addEntryState.volume} onChange={e => { setAddEntryState(p => ({ ...p, volume: e.target.value })); setUrineErrors(p=>({...p,volume:''})); }} />
                  </Field>
                  <Field label="Colour" error={urineErrors.color}>
                    <select style={css.select(urineErrors.color)} value={addEntryState.color} onChange={e => { setAddEntryState(p => ({ ...p, color: e.target.value })); setUrineErrors(p=>({...p,color:''})); }}>
                      <option value="">Select colour</option>
                      <option>Clear</option>
                      <option>Pale Yellow</option>
                      <option>Amber</option>
                      <option>Dark Yellow</option>
                      <option value="Red">Red (Possible Blood)</option>
                    </select>
                  </Field>
                  <Field label="Odour" error={urineErrors.odor}>
                    <select style={css.select(urineErrors.odor)} value={addEntryState.odor} onChange={e => { setAddEntryState(p => ({ ...p, odor: e.target.value })); setUrineErrors(p=>({...p,odor:''})); }}>
                      <option value="">Select odour</option>
                      <option>Normal</option>
                      <option>Strong</option>
                      <option value="Sweet">Sweet (Possible Diabetes)</option>
                      <option value="Ammonia">Ammonia (Possible Dehydration)</option>
                    </select>
                  </Field>
                  <Field label="Remarks" error={urineErrors.remarks} full>
                    <textarea style={css.textarea} placeholder="e.g. Traces of protein, ketones present, leucocytes noted, no abnormalities" value={addEntryState.remarks} onChange={e => { setAddEntryState(p => ({ ...p, remarks: e.target.value })); setUrineErrors(p=>({...p,remarks:''})); }} />
                  </Field>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button style={css.btnSuccess} onClick={addUrineEntry}>Save Urine Entry</button>
                </div>
              </FormPanel>

              {showUrineAnalysisGraph && <UrineAnalysisGraph entries={urineData.entries} onClose={() => setShowUrineAnalysisGraph(false)} />}
            </div>

            {/* ══════════════════════════════════════════════
                NOTES
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={css.sectionTitle}><span style={css.badge(T.rose)} />Clinical Notes</div>
              {loading ? <LoadingSpinner /> : (
                <textarea
                  value={comments || ''}
                  onChange={e => setComments(e.target.value)}
                  disabled={!isEditingComments}
                  placeholder="No clinical notes recorded yet. Click 'Edit / Add Notes' to begin."
                  style={{ ...css.textarea, background: isEditingComments ? T.white : T.surface, minHeight: 120 }}
                />
              )}
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                {!isEditingComments
                  ? <button style={css.btnPrimary} onClick={() => setIsEditingComments(true)}>Edit / Add Notes</button>
                  : <>
                      <button style={css.btnSuccess} onClick={handleUpdateComments}>Save Notes</button>
                      <button style={css.btnSecondary} onClick={() => setIsEditingComments(false)}>Cancel</button>
                    </>
                }
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                DRUGS DURING LABOUR
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={css.sectionTitle}><span style={css.badge(T.teal)} />Drugs Given During Labour</div>
              {loading ? <LoadingSpinner /> : error ? <div style={{ color: T.rose, fontSize: 14, fontFamily:"'DM Sans',sans-serif" }}>{error}</div> : treatmentData.length === 0 ? <EmptyState msg="No drugs recorded during this labour." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>
                      {["Date","Treatment"].map(h => <th key={h} style={css.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {treatmentData.map((e, i) => (
                        <tr key={i} style={{ background: i%2===0?T.white:T.surface }}>
                          <td style={css.td}>{e.date}</td>
                          <td style={css.td}>{e.treatment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button style={css.btnPrimary} onClick={() => setShowTreatmentChatModal(true)}>Chat Drugs Given</button>
              </div>
              {showTreatmentChatModal && (
                <div ref={treatmentChatModalRef} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                  <div style={{ background: T.white, padding: 28, borderRadius: 12, width: '90%', maxWidth: 520 }}>
                    <TreatmentChatModalMaternity maternityId={maternity_id} firstName={first_name} lastName={last_name} age={age} clinicName={clinicName} employeeName={employeeName} token={tokenFromUrl} onClose={() => setShowTreatmentChatModal(false)} />
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════
                PRESCRIPTION
            ══════════════════════════════════════════════ */}
            <div style={css.card}>
              <div style={css.sectionTitle}><span style={css.badge(T.amber)} />Prescription</div>
              {loading ? <LoadingSpinner /> : prescriptions.length === 0 ? <EmptyState msg="No prescriptions issued for this patient." /> : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {prescriptions.map((p, i) => (
                    <li key={i} style={{ padding: "10px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 8, fontSize: 14, color: T.navy, fontFamily: "'DM Sans', sans-serif" }}>{p}</li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 16 }}>
                <button style={css.btnPrimary} onClick={() => setShowPrescriptionPrompt(true)}>Make a Prescription</button>
              </div>
              {showPrescriptionPrompt && (
                <PrescriptionPrompt maternityId={maternity_id} firstName={first_name} lastName={last_name} age={age} clinicName={clinicName} employeeName={employeeName} token={tokenFromUrl} onClose={() => setShowPrescriptionPrompt(false)} />
              )}
            </div>

            {/* ══════════════════════════════════════════════
                AI ASSESSMENT
            ══════════════════════════════════════════════ */}
            <div style={{ ...css.card, background: T.navy, border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Powered by AI</div>
                  <div style={{ color: T.white, fontSize: 16, fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>General Mother Assessment</div>
                  <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Comprehensive clinical review using all recorded data</div>
                </div>
                <button onClick={() => setShowPrompt(true)} style={{ ...css.btnSuccess, whiteSpace: "nowrap", flexShrink: 0 }}>Run Assessment</button>
              </div>
              {showPrompt && (
                <GeneralMotherAssessmentPrompt maternityId={maternity_id} firstName={first_name} lastName={last_name} age={age} clinicName={clinicName} onClose={() => setShowPrompt(false)} />
              )}
            </div>

          </div>{/* /padding wrapper */}
        </div>
      </div>
    </>
  );
};

export default LaborProgressTracker;