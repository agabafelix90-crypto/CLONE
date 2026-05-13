import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

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
  menu:     "M4 6h16M4 12h16M4 18h16",
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
  { name: "Madam Getrude",  role: "LIFE-SURE MEDICARE",         initial: "G", text: "ClinicPro transformed our clinic management. Tracking appointments, sales and expenses has never been easier." },
  { name: "Madam Sarah",    role: "Kikajjo Health Center",      initial: "S", text: "The automated reminders and AI-powered features have saved us so much time and effort!" },
  { name: "Doctor Joshua",  role: "Asaba Medical Clinic",       initial: "J", text: "A fantastic tool that made our clinic run more smoothly. I highly recommend it to every clinic owner." },
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

// ─── CP Logo ──────────────────────────────────────────────────────────────────
const CPLogo = ({ size = 36, dark = false }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: dark ? '#0a1e4a' : 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: dark ? 'none' : '1px solid rgba(255,255,255,0.2)',
    flexShrink: 0, position: 'relative', overflow: 'hidden',
  }}>
    <span style={{
      fontFamily: "'Sora', sans-serif", fontWeight: 900,
      fontSize: size * 0.38, color: '#ffffff', letterSpacing: '-0.5px',
      lineHeight: 1, userSelect: 'none',
    }}>CP</span>
    <div style={{
      position: 'absolute', bottom: size * 0.1, right: size * 0.1,
      width: size * 0.15, height: size * 0.15, borderRadius: '50%',
      background: '#7ec8f7', opacity: 0.9,
    }} />
  </div>
);

// ─── Network Animation ────────────────────────────────────────────────────────
const NetworkAnimation = () => {
  const nodes = [
    { id: 0, x: 80, y: 120 }, { id: 1, x: 260, y: 60 }, { id: 2, x: 420, y: 180 }, { id: 3, x: 600, y: 80 },
    { id: 4, x: 750, y: 220 }, { id: 5, x: 950, y: 100 }, { id: 6, x: 1100, y: 200 }, { id: 7, x: 1300, y: 90 },
    { id: 8, x: 180, y: 320 }, { id: 9, x: 500, y: 360 }, { id: 10, x: 820, y: 340 }, { id: 11, x: 1200, y: 360 },
    { id: 12, x: 80, y: 500 }, { id: 13, x: 340, y: 520 }, { id: 14, x: 680, y: 480 }, { id: 15, x: 1050, y: 520 }, { id: 16, x: 1360, y: 460 }
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[0,8],[1,8],[2,9],[3,9],[4,10],[5,10],[6,11],[7,11],
    [8,13],[9,13],[9,14],[10,14],[10,15],[11,16],[12,13],[13,14],[14,15],[15,16],[12,8],[4,14],[14,6],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg viewBox="0 0 1440 620" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
        <defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {edges.map(([a, b], i) => <line key={`l${i}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="rgba(126,200,247,0.1)" strokeWidth="1" />)}
        {edges.map(([a, b], i) => {
          const na = nodes[a], nb = nodes[b];
          const delay = (i * 0.41) % 7;
          const dur = 5.5 + (i % 5) * 1.2;
          return (
            <circle key={`p${i}`} r="3" fill="#7ec8f7" filter="url(#glow)" opacity="0.9">
              <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={`M${na.x},${na.y} L${nb.x},${nb.y}`} />
              <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        {nodes.map((n, i) => (
          <g key={`n${i}`}>
            <circle cx={n.x} cy={n.y} r="5" fill="#7ec8f7" opacity="0.6" />
            <circle cx={n.x} cy={n.y} r="2.5" fill="#ffffff" opacity="0.85" />
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
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

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

const Wave = ({ color = '#ffffff', flip = false }) => (
  <div style={{ lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none', marginBottom: -1 }}>
    <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
      <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill={color} />
    </svg>
  </div>
);

function FeatureCard({ icon, title, desc, index }) {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)} onTouchEnd={() => setTimeout(() => setHov(false), 300)}
      style={{
        background: hov ? '#0a1e4a' : '#ffffff',
        borderRadius: 18, padding: '24px 18px',
        boxShadow: hov ? '0 16px 48px rgba(10,30,74,0.2)' : '0 2px 16px rgba(10,30,74,0.06)',
        border: `1.5px solid ${hov ? '#0a1e4a' : 'rgba(10,30,74,0.07)'}`,
        cursor: 'default',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.45s ${index * 0.04}s, transform 0.45s ${index * 0.04}s, background 0.25s, box-shadow 0.25s`,
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hov ? 'rgba(255,255,255,0.12)' : 'rgba(10,30,74,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, color: hov ? '#7ec8f7' : '#0a1e4a',
        flexShrink: 0,
      }}>
        <Icon path={ICONS[icon]} size={18} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, color: hov ? '#ffffff' : '#0a1e4a', fontFamily: "'Sora', sans-serif", lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 13, color: hov ? 'rgba(255,255,255,0.65)' : '#6b7a99', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [activeT, setActiveT] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [statsRef, statsInView] = useInView(0.25);
  const [valRef, valInView] = useInView(0.08);

  const clinics  = useCounter(120,   1800, statsInView);
  const patients = useCounter(50000, 2200, statsInView);
  const speed    = useCounter(80,    1600, statsInView);

  const w = useWindowWidth();
  const isMobile  = w < 600;
  const isTablet  = w >= 600 && w < 900;
  const isDesktop = w >= 900;

  useEffect(() => {
    const t = setInterval(() => setActiveT(i => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    const fn = () => { if (mobileMenuOpen) setMobileMenuOpen(false); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [mobileMenuOpen]);

  const openDemo = () => window.open("https://wa.me/256703521101?text=Hi!%20I'm%20interested%20in%20a%20demo.", "_blank");

  // ── Responsive helpers ──
  const px = (mobile, tablet, desktop) => isMobile ? mobile : isTablet ? tablet : desktop;
  const sectionPad = isMobile ? '48px 16px' : isTablet ? '60px 32px' : '80px 5vw';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', overflowX: 'hidden' }}>

      {/* ══ NAVIGATION ══ */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: '#0a1e4a', padding: '12px 4vw', boxShadow: navScrolled ? '0 4px 24px rgba(0,0,0,0.35)' : 'none', transition: 'box-shadow 0.3s' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CPLogo size={32} navScrolled={true} />
              <div className="header-logo"><div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: "'Sora', sans-serif" }}>ClinicPro<span style={{ color: 'rgba(255,255,255,0.6)' }}>System</span></div></div>
            </div>
            <div className="nav-mobile" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button onClick={() => navigate('/pricingphones')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}>Pricing</button>
              <button onClick={() => navigate('/aboutusphones')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}>About</button>
              <button onClick={() => navigate('/login')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: '6px 14px', borderRadius: 8 }}>Log in</button>
              <button onClick={() => navigate('/clinic-registration')} style={{ background: '#ffffff', border: 'none', color: '#0a1e4a', fontWeight: 800, fontSize: 12, cursor: 'pointer', padding: '6px 16px', borderRadius: 9, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>Register Free</button>
            </div>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section style={{
        minHeight: '100svh',
        background: 'linear-gradient(150deg, #071430 0%, #0a1e4a 50%, #1a3d82 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: isMobile ? '88px 16px 36px' : isTablet ? '96px 32px 40px' : '100px 5vw 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        <NetworkAnimation />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, width: '100%' }}>
          {/* Headline */}
          <h1 style={{
            fontSize: isMobile ? '2.1rem' : isTablet ? '2.9rem' : '4.2rem',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: isMobile ? '-1px' : '-2px',
            color: '#ffffff', margin: '0 0 16px',
            fontFamily: "'Sora', sans-serif",
          }}>
            Run Your Clinic<br />
            <span style={{ color: '#7ec8f7' }}>Smarter</span> with AI
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.05rem',
            color: 'rgba(255,255,255,0.65)', maxWidth: 500,
            margin: '0 auto', marginBottom: isMobile ? 28 : 36,
            lineHeight: 1.65, padding: '0 4px',
          }}>
            Automate records, billing, AI reports & reminders — so your team focuses on care.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex', gap: isMobile ? 10 : 12, justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
          }}>
            <button onClick={() => navigate('/clinic-registration')} style={{
              padding: isMobile ? '14px 20px' : '13px 26px',
              borderRadius: 12, border: 'none',
              background: '#ffffff', color: '#0a1e4a',
              fontWeight: 800, fontSize: isMobile ? 14 : 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
              width: isMobile ? '100%' : 'auto', justifyContent: 'center',
            }}>
              Get Started Free <Icon path={ICONS.arrow} size={15} />
            </button>
            <button onClick={openDemo} style={{
              padding: isMobile ? '13px 20px' : '12px 22px',
              borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.08)', color: '#ffffff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              width: isMobile ? '100%' : 'auto', justifyContent: 'center',
              backdropFilter: 'blur(6px)',
            }}>
              <Icon path={ICONS.whatsapp} size={15} color="#5de0a0" /> Book Demo
            </button>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex', gap: isMobile ? 12 : 20, justifyContent: 'center',
            flexWrap: 'wrap', marginTop: isMobile ? 24 : 32,
          }}>
            {['No credit card', 'Setup in minutes', 'Uganda-built'].map(t => (
              <span key={t} style={{
                fontSize: isMobile ? 11 : 12, color: 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              }}>
                <Icon path={ICONS.check} size={10} color="#5de0a0" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero stats bar */}
        <div style={{
          position: 'relative', zIndex: 1, marginTop: isMobile ? 36 : 48,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          width: '100%', maxWidth: 960,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {[['120+','Clinics'],['50K+','Patients'],['80%','Faster'],['5 ★','Rating']].map(([n, l]) => (
            <div key={l} style={{
              padding: isMobile ? '18px 6px' : '24px 10px',
              textAlign: 'center', background: 'rgba(255,255,255,0.04)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize: isMobile ? '1.3rem' : '1.9rem', fontWeight: 900, color: '#ffffff' }}>{n}</div>
              <div style={{ fontSize: isMobile ? 9 : 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ABOUT SECTION ══ */}
      <Wave color="#f8faff" />
      <section style={{ padding: sectionPad, background: '#f8faff' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: isDesktop ? 50 : 36,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', marginBottom: 12 }}>ABOUT</div>
            <h2 style={{ fontSize: isMobile ? '1.7rem' : '2.1rem', fontWeight: 900, margin: '0 0 16px', fontFamily: "'Sora', sans-serif", lineHeight: 1.15 }}>
              What is<br />ClinicProSystem?
            </h2>
            <p style={{ color: '#4a5c82', lineHeight: 1.7, fontSize: isMobile ? 14 : 15, margin: 0 }}>
              AI-powered healthcare management platform designed to revolutionize clinic operations.
            </p>
            {expanded && (
              <p style={{ marginTop: 12, color: '#4a5c82', fontSize: isMobile ? 14 : 15, lineHeight: 1.7 }}>
                From patient management to finance, lab, radiology, and AI employee tracking — all in one seamless platform built for Uganda's healthcare context.
              </p>
            )}
            <button onClick={() => setExpanded(e => !e)} style={{
              background: 'none', border: 'none', color: '#0a1e4a', fontWeight: 800,
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              fontSize: 14, padding: 0,
            }}>
              {expanded ? 'Show less' : 'Read more'} <Icon path={ICONS.arrow} size={12} />
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: isMobile ? 10 : 14,
          }}>
            {[{ icon:'ai', label:'AI-Powered' }, { icon:'users', label:'Patient-First' }, { icon:'chart', label:'Analytics' }, { icon:'bell', label:'Reminders' }].map(({ icon, label }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 16, padding: isMobile ? '16px 10px' : '20px 14px',
                textAlign: 'center', boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                border: '1px solid rgba(10,30,74,0.05)',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Icon path={ICONS[icon]} size={17} color="#0a1e4a" />
                </div>
                <div style={{ fontWeight: 800, fontSize: isMobile ? 12 : 14, color: '#0a1e4a' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section style={{ padding: sectionPad, background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 44 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#3a7bd5', fontWeight: 700 }}>CAPABILITIES</div>
          <h2 style={{ fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 900, fontFamily: "'Sora', sans-serif", margin: '12px 0 0' }}>
            Everything Digitalized
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? 14 : 18,
          maxWidth: 1100, margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
        </div>
      </section>

      {/* ══ STATS ══ */}
      <Wave color="#0a1e4a" />
      <section ref={statsRef} style={{ background: '#0a1e4a', padding: sectionPad, textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: '#7ec8f7', letterSpacing: 2, fontWeight: 700 }}>IMPACT</div>
          <h2 style={{ color: '#fff', fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 900, margin: '16px 0 36px', fontFamily: "'Sora', sans-serif" }}>
            Numbers That Matter
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {[
              { val: `${clinics}+`, label: 'Clinics' },
              { val: `${patients}+`, label: 'Patients' },
              { val: `${speed}%`, label: 'Faster' },
              { val: '5 ★', label: 'Rating' },
            ].map(({ val, label }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', padding: isMobile ? '22px 4px' : '32px 8px' }}>
                <div style={{ fontSize: isMobile ? '1.4rem' : '2.2rem', fontWeight: 900, color: '#7ec8f7' }}>{val}</div>
                <div style={{ fontSize: isMobile ? 9 : 10, color: 'rgba(255,255,255,0.45)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Wave color="#f8faff" flip />

      {/* ══ VALUE PROPS ══ */}
      <section style={{ padding: sectionPad, background: '#f8faff' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 2fr' : '1fr',
          gap: isDesktop ? 48 : 32,
          alignItems: 'start',
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#3a7bd5', fontWeight: 700 }}>WHY US</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 900, fontFamily: "'Sora', sans-serif", margin: '14px 0 20px', lineHeight: 1.2 }}>
              20 Ways We Add Value
            </h2>
            <button onClick={openDemo} style={{
              background: '#0a1e4a', color: '#fff',
              padding: '12px 22px', borderRadius: 40, border: 'none',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
              cursor: 'pointer', fontSize: 14,
            }}>
              <Icon path={ICONS.whatsapp} size={14} color="#5de0a0" /> Book Demo
            </button>
          </div>

          <div ref={valRef} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? 8 : 10,
          }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{
                display: 'flex', gap: 9, background: '#fff', borderRadius: 12,
                padding: isMobile ? '11px 12px' : '12px 14px',
                alignItems: 'flex-start',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                border: '1px solid rgba(10,30,74,0.04)',
                opacity: valInView ? 1 : 0,
                transform: valInView ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ${i * 0.02}s, transform 0.4s ${i * 0.02}s`,
              }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <Icon path={ICONS.check} size={12} color="#0a1e4a" />
                </div>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, color: '#2a3a55', lineHeight: 1.45 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ padding: sectionPad, background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 44 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#3a7bd5', fontWeight: 700 }}>TESTIMONIALS</div>
          <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, margin: '12px 0 0' }}>
            Loved by Clinics in Uganda
          </h2>
        </div>

        {/* Featured quote */}
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          background: 'linear-gradient(135deg,#0a1e4a,#1a3d82)',
          borderRadius: isMobile ? 18 : 22,
          padding: isMobile ? '28px 18px' : isTablet ? '36px 28px' : '44px 48px',
          marginBottom: isMobile ? 20 : 28,
        }}>
          <Icon path={ICONS.quote} size={isMobile ? 30 : 40} color="rgba(126,200,247,0.15)" />
          <p style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            color: 'rgba(255,255,255,0.88)', fontStyle: 'italic',
            margin: '16px 0 24px', lineHeight: 1.65,
          }}>
            "{TESTIMONIALS[activeT].text}"
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#7ec8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 17, color: '#0a1e4a', flexShrink: 0 }}>
                {TESTIMONIALS[activeT].initial}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{TESTIMONIALS[activeT].name}</div>
                <div style={{ fontSize: 11, color: '#7ec8f7' }}>{TESTIMONIALS[activeT].role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveT(i)} style={{
                  width: i === activeT ? 22 : 6, height: 6, borderRadius: 3,
                  background: i === activeT ? '#7ec8f7' : 'rgba(255,255,255,0.25)',
                  border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.25s',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 14,
          maxWidth: 1100, margin: '0 auto',
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} onClick={() => setActiveT(i)} style={{
              background: '#f8faff', borderRadius: 16,
              padding: isMobile ? '18px 14px' : '20px 16px',
              border: `2px solid ${i === activeT ? '#0a1e4a' : 'rgba(10,30,74,0.07)'}`,
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[...Array(5)].map((_, si) => <Icon key={si} path={ICONS.star} size={11} color="#f5a623" />)}
              </div>
              <p style={{ fontSize: 13, color: '#4a5c82', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.55 }}>
                "{t.text.length > 70 ? t.text.slice(0, 70) + '…' : t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0a1e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {t.initial}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: '#0a1e4a' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#3a7bd5' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <Wave color="#0a1e4a" />
      <section style={{
        background: 'linear-gradient(150deg,#071430,#0a1e4a)',
        padding: isMobile ? '60px 16px 56px' : '80px 5vw',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.8rem' : isTablet ? '2.4rem' : '3rem',
          fontWeight: 900, color: '#fff',
          fontFamily: "'Sora', sans-serif",
          lineHeight: 1.15, margin: '0 0 16px',
        }}>
          Ready to Transform<br />
          <span style={{ color: '#7ec8f7' }}>Your Clinic?</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: '0 auto 32px', maxWidth: 460, fontSize: isMobile ? 14 : 15, lineHeight: 1.6 }}>
          Join hundreds of clinics across Uganda running smarter with AI.
        </p>
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', padding: isMobile ? '0 4px' : 0,
        }}>
          <button onClick={() => navigate('/clinic-registration')} style={{
            padding: isMobile ? '14px 20px' : '14px 32px',
            borderRadius: 12, background: '#fff', color: '#0a1e4a',
            fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center',
            gap: 7, cursor: 'pointer', fontSize: 14,
            width: isMobile ? '100%' : 'auto', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}>
            Register Free <Icon path={ICONS.arrow} size={15} />
          </button>
          <button onClick={openDemo} style={{
            padding: isMobile ? '13px 20px' : '13px 28px',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.28)',
            background: 'rgba(255,255,255,0.09)', color: '#fff',
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center',
            gap: 7, cursor: 'pointer',
            width: isMobile ? '100%' : 'auto', justifyContent: 'center',
          }}>
            <Icon path={ICONS.whatsapp} size={15} color="#5de0a0" /> WhatsApp Us
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#06121f', padding: isMobile ? '40px 16px 24px' : '56px 5vw 28px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 28 : 32,
            paddingBottom: isMobile ? 28 : 40,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            textAlign: isMobile ? 'center' : 'left',
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: isMobile ? 'center' : 'flex-start', marginBottom: 10 }}>
                <CPLogo size={28} dark />
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: "'Sora', sans-serif" }}>ClinicProSystem</span>
              </div>
              <p style={{ fontSize: 12, color: '#445577', margin: 0, lineHeight: 1.6 }}>
                AI-powered clinic management<br />built for Uganda.
              </p>
            </div>

            {/* Links */}
            <div>
              <div style={{ fontSize: 10, color: '#7ec8f7', letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>LINKS</div>
              <button onClick={() => navigate('/pricingmobile')} style={{ background: 'none', border: 'none', color: '#88a0c0', display: 'block', cursor: 'pointer', padding: '4px 0', fontSize: 13, width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>Pricing</button>
              <button onClick={() => navigate('/aboutusmobile')}  style={{ background: 'none', border: 'none', color: '#88a0c0', display: 'block', cursor: 'pointer', padding: '4px 0', marginTop: 4, fontSize: 13, width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>About Us</button>
              <button onClick={() => navigate('/login')}          style={{ background: 'none', border: 'none', color: '#88a0c0', display: 'block', cursor: 'pointer', padding: '4px 0', marginTop: 4, fontSize: 13, width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>Log In</button>
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 10, color: '#7ec8f7', letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>CONTACT</div>
              <p style={{ fontSize: 13, color: '#88a0c0', margin: '0 0 14px', lineHeight: 1.7 }}>
                +256 703 521 101<br />clinicproug@gmail.com
              </p>
              <button onClick={openDemo} style={{
                background: '#0a1e4a', border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 18px', borderRadius: 30, color: '#fff', fontSize: 12,
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}>
                <Icon path={ICONS.whatsapp} size={12} color="#5de0a0" /> WhatsApp
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: '#2a3a55' }}>
            © 2025 ClinicProSystem. Built with ❤ in Uganda
          </div>
        </div>
      </footer>

      {/* ══ STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%      { opacity: 0.5; transform: scale(1.45); }
        }

        html { overflow-x: hidden; scroll-behavior: smooth; }
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
      `}</style>
    </div>
  );
};

export default LandingPage;