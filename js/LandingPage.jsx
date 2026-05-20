import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import Pricing from './Pricing';
import AboutUs from './AboutUs';
import LandingNav from './LandingNav';

// ─── Inline SVG Icon ──────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  arrow:    "M5 12h14M12 5l7 7-7 7",
  check:    "M20 6L9 17l-5-5",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z",
  ai:       "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  chart:    "M18 20V10M12 20V4M6 20v-6",
  bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  cake:     "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8",
  pill:     "M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7.5",
  heart:    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  receipt:  "M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2zM8 10h8M8 14h4",
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  quote:    "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  x:        "M18 6L6 18M6 6l12 12",
};

const FEATURES = [
  { icon: 'ai',       title: 'AI Employee Assessment',     desc: 'Automatically evaluates staff performance and delivers actionable insights.' },
  { icon: 'receipt',  title: 'Instant Patient Receipts',   desc: 'Automated receipts delivered the moment payments are processed.' },
  { icon: 'bell',     title: 'Debt Reminder Automation',   desc: 'Smart SMS reminders eliminate the awkward task of chasing patient balances.' },
  { icon: 'calendar', title: 'Appointment SMS Alerts',     desc: 'Reduce no-shows with automated reminders for every scheduled visit.' },
  { icon: 'cake',     title: 'Birthday Greetings',         desc: 'Build patient loyalty with automated personalized birthday messages via SMS.' },
  { icon: 'file',     title: 'AI Report Writing',          desc: 'Generate obstetric ultrasound reports and prescriptions at speed.' },
  { icon: 'utensils', title: 'Nutrition Recommendations',  desc: 'AI-curated food lists for better drug absorption sent via WhatsApp.' },
  { icon: 'pill',     title: 'Drug Suggestions',           desc: 'Contextual prescription suggestions based on diagnosis and symptoms.' },
  { icon: 'heart',    title: 'Antenatal Auto-Detection',   desc: 'Proactively reminds mothers approaching ultrasound and ANC dates.' },
  { icon: 'mail',     title: 'Targeted Bulk Messaging',    desc: 'Reach all patients or a specific group with one click.' },
  { icon: 'chart',    title: 'District Report Generation', desc: 'AI-assisted reports aligned to district health reporting standards.' },
  { icon: 'file',     title: 'Electronic Health Records',  desc: 'Secure, searchable digital patient files always at your fingertips.' },
];

const TESTIMONIALS = [
  { name: "Dr. Mukasa Brian",  role: "Medical Director, Kampala Medical Centre", initial: "DM", text: "MediCoreSystem has completely transformed how we manage patient records. Everything is digital, fast, and reliable. Our efficiency improved by 60%!" },
  { name: "Nakato Florence",   role: "Clinic Owner, Grace Health Clinic, Jinja",      initial: "NF", text: "I used to struggle with tracking drug inventory and patient debts. MediCore handles it all automatically — even sends SMS reminders to patients!" },
  { name: "Ssempijja Ronald",  role: "Lab Technician, Mbarara Regional Hospital",       initial: "SR", text: "The lab module is a game changer. Results are recorded and shared instantly. No more lost paperwork or delays. Highly recommend it!" },
  { name: "Auma Patricia",    role: "Head Nurse, Lira Community Health Centre",      initial: "AP", text: "Managing maternity records and antenatal visits is now so easy. MediCore even reminds mothers of their next appointment via SMS!" },
  { name: "Opio Samuel",      role: "Administrator, Gulu Family Clinic",            initial: "OS", text: "We went from paper files to a fully digital system in one week. The AI report writing feature alone saves us hours every day!" },
  { name: "Nambi Harriet",    role: "Cashier, Entebbe Wellness Centre",             initial: "NH", text: "Billing and receipts are now automatic. Patients get their receipts instantly and I can track every shilling. MediCore is a lifesaver!" },
];

const VALUES = [
  "Increased Patient Satisfaction & Loyalty","Better Appointment Scheduling",
  "Enhanced Communication with Patients","Improved Patient Care Through Timely Reminders",
  "Increased Financial Stability","Streamlined Payment Process",
  "Personalized Patient Experience","Better Management of Chronic Conditions",
  "Increased Patient Retention","Efficient Resource Allocation",
  "Proactive Health Management","Increased Turn-Up for Preventive Care",
  "Better Treatment Outcomes","Greater Access to Care",
  "Reduced Missed Appointments","Enhanced Doctor-Patient Communication",
  "Improved Clinic Revenue","Faster, More Accurate Documentation",
  "Increased Patient Engagement","Improved Patient Trust",
];

// ─── MEDCORE Logo ─────────────────────────────────────────────────────────────
const CPLogo = ({ size = 36, dark = false, navScrolled = false }) => {
  const bg = dark ? '#0a1e4a' : (navScrolled ? '#0a1e4a' : 'rgba(255,255,255,0.2)');
  const textColor = '#ffffff';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: bg, backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.35s', position: 'relative', overflow: 'hidden',
      border: dark ? 'none' : '1px solid rgba(255,255,255,0.15)',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Sora', sans-serif", fontWeight: 900,
        fontSize: size * 0.38, color: textColor, letterSpacing: '-0.5px',
        lineHeight: 1, userSelect: 'none',
      }}>MC</span>
      {/* subtle accent dot */}
      <div style={{
        position: 'absolute', bottom: size * 0.1, right: size * 0.1,
        width: size * 0.14, height: size * 0.14, borderRadius: '50%',
        background: '#7ec8f7', opacity: 0.9,
      }} />
    </div>
  );
};

// ─── Network Node Animation ───────────────────────────────────────────────────
const NetworkAnimation = () => {
  // Node positions (% of 1440x900 viewBox) — spread across full hero
  const nodes = [
    { id: 0,  x: 80,   y: 120,  label: 'Clinic A' },
    { id: 1,  x: 260,  y: 60,   label: 'Lab'      },
    { id: 2,  x: 420,  y: 180,  label: 'Pharmacy' },
    { id: 3,  x: 600,  y: 80,   label: 'Clinic B' },
    { id: 4,  x: 750,  y: 220,  label: 'Records'  },
    { id: 5,  x: 950,  y: 100,  label: 'Clinic C' },
    { id: 6,  x: 1100, y: 200,  label: 'Reports'  },
    { id: 7,  x: 1300, y: 90,   label: 'Clinic D' },
    { id: 8,  x: 180,  y: 320,  label: 'Doctor'   },
    { id: 9,  x: 500,  y: 360,  label: 'Patient'  },
    { id: 10, x: 820,  y: 340,  label: 'SMS'      },
    { id: 11, x: 1200, y: 360,  label: 'Billing'  },
    { id: 12, x: 80,   y: 500,  label: 'Nurse'    },
    { id: 13, x: 340,  y: 520,  label: 'ANC'      },
    { id: 14, x: 680,  y: 480,  label: 'AI Core'  },
    { id: 15, x: 1050, y: 520,  label: 'Clinic E' },
    { id: 16, x: 1360, y: 460,  label: 'Finance'  },
  ];

  // Edges — pairs of node IDs
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],
    [0,8],[1,8],[2,9],[3,9],[4,10],[5,10],[6,11],[7,11],
    [8,13],[9,13],[9,14],[10,14],[10,15],[11,16],[12,13],
    [13,14],[14,15],[15,16],[12,8],[4,14],[14,6],
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 620"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glowing dot travelling along a path */}
          {edges.map(([a, b], i) => {
            const na = nodes[a], nb = nodes[b];
            const len = Math.sqrt((nb.x-na.x)**2 + (nb.y-na.y)**2);
            return (
              <React.Fragment key={`def-${i}`}>
                <path id={`edge-path-${i}`} d={`M${na.x},${na.y} L${nb.x},${nb.y}`} />
              </React.Fragment>
            );
          })}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Static edge lines */}
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          return (
            <line key={`line-${i}`}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(126,200,247,0.12)" strokeWidth="1"
            />
          );
        })}

        {/* Animated data packets travelling along edges */}
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          const delay = (i * 0.41) % 7;
          const dur = 5.5 + (i % 5) * 1.2;
          return (
            <circle key={`packet-${i}`} r="3" fill="#7ec8f7" filter="url(#glow)" opacity="0.9">
              <animateMotion
                dur={`${dur}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M${na.x},${na.y} L${nb.x},${nb.y}`}
              />
              <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* Reverse packets on some edges for busier feel */}
        {edges.filter((_,i) => i % 3 === 0).map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          const delay = (i * 0.7 + 1.1) % 7;
          const dur = 6.5 + (i % 4) * 1.0;
          return (
            <circle key={`packet-rev-${i}`} r="2.5" fill="#5de0a0" filter="url(#glow)" opacity="0.75">
              <animateMotion
                dur={`${dur}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={`M${nb.x},${nb.y} L${na.x},${na.y}`}
              />
              <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* Node dots */}
        {nodes.map((n, i) => (
          <g key={`node-${i}`}>
            {/* Outer pulse ring */}
            <circle cx={n.x} cy={n.y} r="12" fill="none" stroke="rgba(126,200,247,0.18)" strokeWidth="1">
              <animate attributeName="r" values="8;16;8" dur={`${3 + (i % 3)}s`} begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur={`${3 + (i % 3)}s`} begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
            </circle>
            {/* Core dot */}
            <circle cx={n.x} cy={n.y} r="5" fill="#7ec8f7" opacity="0.7" filter="url(#nodeGlow)" />
            <circle cx={n.x} cy={n.y} r="3" fill="#ffffff" opacity="0.9" />
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCounter(target, duration = 2000, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return val;
}

const Wave = ({ color = '#ffffff', flip = false }) => (
  <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none', marginBottom: -1 }}>
    <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
      <path d="M0,36 C480,72 960,0 1440,36 L1440,72 L0,72 Z" fill={color} />
    </svg>
  </div>
);

function FeatureCard({ icon, title, desc, index }) {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView(0.1);
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#0a1e4a' : '#ffffff', borderRadius: 20, padding: '32px 26px',
        boxShadow: hov ? '0 20px 60px rgba(10,30,74,0.22)' : '0 2px 20px rgba(10,30,74,0.07)',
        border: `1.5px solid ${hov ? '#0a1e4a' : 'rgba(10,30,74,0.08)'}`, cursor: 'default',
        opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.5s ${index * 0.045}s, transform 0.5s ${index * 0.045}s, background 0.3s, box-shadow 0.3s`,
      }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: hov ? 'rgba(255,255,255,0.13)' : 'rgba(10,30,74,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: hov ? '#ffffff' : '#0a1e4a', transition: 'background 0.3s, color 0.3s' }}>
        <Icon path={ICONS[icon]} size={22} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: hov ? '#ffffff' : '#0a1e4a', fontFamily: "'Sora', sans-serif", transition: 'color 0.3s' }}>{title}</div>
      <div style={{ fontSize: 14, color: hov ? 'rgba(255,255,255,0.7)' : '#6b7a99', lineHeight: 1.7, transition: 'color 0.3s' }}>{desc}</div>
    </div>
  );
}

// ─── Overlay Panel ────────────────────────────────────────────────────────────
function OverlayPanel({ open, onClose, children, title }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(6,18,31,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 1, marginTop: 0, background: '#f8faff', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', animation: 'slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ height: 64, background: '#0a1e4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5vw', flexShrink: 0, boxShadow: '0 2px 24px rgba(10,30,74,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CPLogo size={32} dark />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, color: '#ffffff', fontSize: 17 }}>MEDCORE<span style={{ color: '#7ec8f7' }}>System</span> <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 14 }}>/ {title}</span></span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <Icon path={ICONS.x} size={18} color="#ffffff" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [activeT, setActiveT] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [statsRef, statsInView] = useInView(0.3);
  const [valRef, valInView]     = useInView(0.1);
  const clinics  = useCounter(120,   1800, statsInView);
  const patients = useCounter(50000, 2200, statsInView);
  const speed    = useCounter(80,    1600, statsInView);

  useEffect(() => {
    const t = setInterval(() => setActiveT(i => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(t);
  }, []);

  const openDemo = () => window.open("https://wa.me/2567526488446?text=Hi!%20I'm%20interested%20in%20a%20demo.", "_blank");

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', color: '#0a1e4a', overflowX: 'hidden' }}>

      {/* ── Overlay panels ── */}
      <OverlayPanel open={showPricing} onClose={() => setShowPricing(false)} title="Pricing">
        <Pricing />
      </OverlayPanel>
      <OverlayPanel open={showAbout} onClose={() => setShowAbout(false)} title="About Us">
        <AboutUs />
      </OverlayPanel>

      <LandingNav />
      <div id="pricing" style={{ position: 'relative', top: '-72px' }} />

      {/* ══ HERO ══ */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #071430 0%, #0a1e4a 45%, #1a3d82 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 5vw 0', position: 'relative', overflow: 'hidden' }}>
        {/* dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="white" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 340, height: 340, borderRadius: '50%', background: 'rgba(58,123,213,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Network node animation background */}
        <NetworkAnimation />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 100, padding: '7px 18px', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 36, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5de0a0', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
            Uganda's #1 AI-Powered Clinic Management System
          </div>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6.5vw, 5.8rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-2.5px', color: '#ffffff', margin: '0 0 24px', fontFamily: "'Sora', sans-serif" }}>
            Run Your Clinic<br /><span style={{ color: '#7ec8f7' }}>Smarter</span> with AI
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto 52px', lineHeight: 1.8 }}>
            MEDCORE automates patient records, billing, AI reports, appointment reminders and more — so your team can focus entirely on delivering great care.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/clinic-registration')}
              style={{ padding: '16px 36px', borderRadius: 12, border: 'none', background: '#ffffff', color: '#0a1e4a', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.25)'; }}>
              Get Started Free <Icon path={ICONS.arrow} size={18} color="#0a1e4a" />
            </button>
            <button onClick={openDemo}
              style={{ padding: '16px 32px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <Icon path={ICONS.whatsapp} size={18} color="#5de0a0" /> Book a Demo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginTop: 44 }}>
            {['No credit card required', 'Setup in minutes', 'Uganda-built & supported'].map(t => (
              <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon path={ICONS.check} size={13} color="#5de0a0" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', width: '100%', maxWidth: 1000, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[['120+','Clinics Onboarded'],['50K+','Patients Managed'],['80%','Faster Documentation'],['5 ★','Client Rating']].map(([n,l]) => (
            <div key={l} style={{ padding: '28px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', fontFamily: "'Sora',sans-serif", letterSpacing: '-1px' }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <Wave color="#f8faff" />

      {/* ══ ABOUT SNIPPET ══ */}
      <section id="about" style={{ padding: 'clamp(60px,9vw,110px) 5vw', background: '#f8faff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 14 }}>About the Platform</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-1px', margin: '0 0 20px', fontFamily: "'Sora', sans-serif", color: '#0a1e4a' }}>What is<br />MEDCORE?</h2>
            <p style={{ color: '#4a5c82', fontSize: 15.5, lineHeight: 1.8, marginBottom: 16 }}>
              MEDCORE is a modern, AI-powered healthcare management platform designed to revolutionize the way clinics and medical facilities operate.
            </p>
            {expanded && (<p style={{ color: '#4a5c82', fontSize: 15.5, lineHeight: 1.8, marginBottom: 16 }}>With advanced AI capabilities, it optimizes everything from patient management and drug inventory tracking to lab test processing, radiology, maternity care, finance management, employee performance tracking, and patient feedback collection.</p>)}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <button onClick={() => setExpanded(e => !e)} style={{ color: '#0a1e4a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
                {expanded ? 'Show Less' : 'Read More'} <Icon path={ICONS.arrow} size={14} color="#0a1e4a" />
              </button>
             
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{icon:'ai',label:'AI-Powered',sub:'Smart automation'},{icon:'users',label:'Patient-First',sub:'Better outcomes'},{icon:'chart',label:'Data Analytics',sub:'Insightful reports'},{icon:'bell',label:'Auto Reminders',sub:'Zero missed visits'}].map(({icon,label,sub}) => (
              <div key={label} style={{ background: '#ffffff', borderRadius: 18, padding: '28px 22px', textAlign: 'center', boxShadow: '0 4px 24px rgba(10,30,74,0.08)', border: '1.5px solid rgba(10,30,74,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(10,30,74,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(10,30,74,0.08)'; }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#0a1e4a' }}><Icon path={ICONS[icon]} size={22} /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0a1e4a', fontFamily: "'Sora',sans-serif" }}>{label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ padding: 'clamp(60px,9vw,110px) 5vw', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 14 }}>Capabilities</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-1px', margin: '0 0 16px', fontFamily: "'Sora', sans-serif", color: '#0a1e4a' }}>Everything Your Clinic Needs,<br /><span style={{ color: '#3a7bd5' }}>Digitalized</span></h2>
            <p style={{ color: '#4a5c82', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>12 powerful features working in harmony to make your clinic run smoother, faster, and smarter.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 22 }}>
            {FEATURES.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <div style={{ background: '#f8faff' }}><Wave color="#0a1e4a" /></div>
      <section ref={statsRef} style={{ background: '#0a1e4a', padding: 'clamp(70px,10vw,110px) 2vw', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 14 }}>Our Impact</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', marginBottom: 64, fontFamily: "'Sora', sans-serif" }}>Numbers That Tell the Story</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            {[{val:`${clinics}+`,label:'Clinics Onboarded'},{val:`${patients}+`,label:'Patients Managed'},{val:`${speed}%`,label:'Faster Documentation'},{val:'5 ★',label:'Average Client Rating'}].map(({val,label}) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', padding: '48px 16px', borderRight: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem,3.5vw,3.5rem)', fontWeight: 900, color: '#7ec8f7', fontFamily: "'Sora',sans-serif", letterSpacing: '-1px', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Wave color="#f8faff" flip />

      {/* ══ 20 VALUES ══ */}
      <section style={{ padding: 'clamp(60px,9vw,110px) 5vw', background: '#f8faff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 14 }}>Why Choose Us</div>
              <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-1px', margin: '0 0 20px', fontFamily: "'Sora', sans-serif", color: '#0a1e4a' }}><span style={{ color: '#3a7bd5' }}>20 Ways</span><br />We Add Value</h2>
              <p style={{ color: '#4a5c82', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>From financial stability to patient loyalty, MEDCORE touches every dimension of clinic life.</p>
              <button onClick={openDemo} style={{ padding: '14px 28px', borderRadius: 10, border: 'none', background: '#0a1e4a', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(10,30,74,0.25)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#142d6e'}
                onMouseLeave={e => e.currentTarget.style.background = '#0a1e4a'}>
                <Icon path={ICONS.whatsapp} size={16} color="#5de0a0" /> Book a Demo
              </button>
            </div>
            <div ref={valRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {VALUES.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#ffffff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid rgba(10,30,74,0.07)', boxShadow: '0 2px 12px rgba(10,30,74,0.04)', opacity: valInView ? 1 : 0, transform: valInView ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.45s ${i * 0.03}s, transform 0.45s ${i * 0.03}s, border-color 0.2s` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a1e4a'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,30,74,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(10,30,74,0.07)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(10,30,74,0.04)'; }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0a1e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Icon path={ICONS.check} size={13} color="#fff" /></div>
                  <span style={{ fontSize: 13.5, color: '#2a3a5c', lineHeight: 1.55, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="testimonials" style={{ padding: 'clamp(60px,9vw,110px) 5vw', background: '#ffffff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 14 }}>Testimonials</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-1px', fontFamily: "'Sora', sans-serif", color: '#0a1e4a' }}>Loved by Clinics Across<br /><span style={{ color: '#3a7bd5' }}>Uganda</span></h2>
          </div>

          {/* Main featured testimonial */}
          <div style={{ background: 'linear-gradient(135deg, #0a1e4a 0%, #1a3d82 100%)', borderRadius: 24, padding: 'clamp(36px,5vw,60px)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <Icon path={ICONS.quote} size={52} color="rgba(126,200,247,0.18)" />
            <p style={{ fontSize: 'clamp(1rem,2vw,1.25rem)', color: 'rgba(255,255,255,0.9)', lineHeight: 1.8, margin: '20px 0 36px', fontStyle: 'italic', position: 'relative', zIndex: 1, maxWidth: 720 }}>
              "{TESTIMONIALS[activeT].text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#7ec8f7,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#0a1e4a' }}>{TESTIMONIALS[activeT].initial}</div>
                <div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 15 }}>{TESTIMONIALS[activeT].name}</div>
                  <div style={{ fontSize: 13, color: '#7ec8f7', marginTop: 2 }}>{TESTIMONIALS[activeT].role}</div>
                </div>
              </div>
              {/* Dot nav */}
              <div style={{ display: 'flex', gap: 8 }}>
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setActiveT(i)} style={{ width: i === activeT ? 28 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === activeT ? '#7ec8f7' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial cards — centred grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, justifyItems: 'center' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} onClick={() => setActiveT(i)}
                style={{
                  width: '100%', background: '#f8faff', borderRadius: 18, padding: '28px 24px',
                  border: `2px solid ${i === activeT ? '#0a1e4a' : 'rgba(10,30,74,0.08)'}`,
                  cursor: 'pointer', transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.2s',
                  boxShadow: i === activeT ? '0 4px 24px rgba(10,30,74,0.14)' : '0 2px 12px rgba(10,30,74,0.04)',
                  transform: i === activeT ? 'translateY(-4px)' : 'translateY(0)',
                }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{[...Array(5)].map((_,si) => <Icon key={si} path={ICONS.star} size={14} color="#f5a623" />)}</div>
                <p style={{ fontSize: 14, color: '#4a5c82', lineHeight: 1.72, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0a1e4a,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0 }}>{t.initial}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0a1e4a' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#3a7bd5', marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <div style={{ background: '#ffffff' }}><Wave color="#0a1e4a" /></div>
      <section style={{ background: 'linear-gradient(150deg,#071430,#0a1e4a,#1a3d82)', padding: 'clamp(80px,12vw,130px) 5vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-1.5px', margin: '0 0 18px', fontFamily: "'Sora', sans-serif" }}>Ready to Transform<br /><span style={{ color: '#7ec8f7' }}>Your Clinic?</span></h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 46, lineHeight: 1.75 }}>Join hundreds of clinics across Uganda already running smarter with MEDCORE. Setup takes minutes, not weeks.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/clinic-registration')}
              style={{ padding: '16px 36px', borderRadius: 12, border: 'none', background: '#ffffff', color: '#0a1e4a', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Register Free <Icon path={ICONS.arrow} size={17} color="#0a1e4a" />
            </button>
            <button onClick={openDemo}
              style={{ padding: '16px 32px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <Icon path={ICONS.whatsapp} size={17} color="#5de0a0" /> WhatsApp Us
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer id="contact" style={{ background: '#06121f', padding: 'clamp(60px,8vw,90px) 5vw 36px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 48, paddingBottom: 56, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Brand */}
            <div style={{ flex: '1 1 240px', maxWidth: 300, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                <CPLogo size={34} dark />
                <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', fontFamily: "'Sora',sans-serif" }}>MEDCORE<span style={{ color: '#7ec8f7' }}>System</span></span>
              </div>
              <div style={{ fontSize: 10, color: '#3a5580', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Care. Smart. Digital.</div>
              <p style={{ fontSize: 14, color: '#445577', lineHeight: 1.8 }}>Modern AI-powered clinic management. Built for Uganda, trusted by hundreds of healthcare facilities.</p>
            </div>
            {/* Quick Links */}
            <div style={{ flex: '1 1 160px', maxWidth: 200, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 20 }}>Quick Links</div>
              {[['Pricing', () => setShowPricing(true)], ['About Us', () => setShowAbout(true)], ['Privacy Policy', () => navigate('/privacy-policy')], ['Terms of Service', () => navigate('/terms-of-service')], ['Compliance', () => navigate('/compliance')]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 14, color: '#445577', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#445577'}>{l}</button>
              ))}
              <button onClick={() => navigate('/clinic-registration')} style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 14, color: '#445577', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#445577'}>Register</button>
            </div>
            {/* Contact */}
            <div style={{ flex: '1 1 200px', maxWidth: 260, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 20 }}>Contact Us</div>
              <p style={{ fontSize: 14, color: '#445577', lineHeight: 2.2 }}>+256 752 648844<br />+256 782 547057<br />support@medcore.africa</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button onClick={openDemo}
                  style={{ padding: '11px 22px', borderRadius: 9, border: 'none', background: '#0a1e4a', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s', boxShadow: '0 2px 12px rgba(10,30,74,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#142d6e'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0a1e4a'}>
                  <Icon path={ICONS.whatsapp} size={15} color="#5de0a0" /> Chat on WhatsApp
                </button>
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <span style={{ fontSize: 13, color: '#2a3a55' }}>© 2025 MEDCORE. All rights reserved.</span>
            <span style={{ fontSize: 13, color: '#2a3a55' }}>Built with ❤ in Uganda</span>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8faff; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f4ff; }
        ::-webkit-scrollbar-thumb { background: #0a1e4a; border-radius: 3px; }

        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.55; transform:scale(1.6); }
        }
        @keyframes slideDown {
          from { transform:translateY(-40px); opacity:0; }
          to   { transform:translateY(0);     opacity:1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
