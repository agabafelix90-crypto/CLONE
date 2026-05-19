import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Nav height constant — matches LandingPage ───────────────────────────────
const NAV_H = 68;

// ── Icon ────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z",
  cloud:    "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
  server:   "M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  info:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4",
  heart:    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  menu:     "M4 6h16M4 12h16M4 18h16",   // hamburger
  close:    "M18 6L6 18M6 6l12 12",      // X
};

const openWhatsApp = (msg) =>
  window.open(`https://wa.me/256700123456?text=${encodeURIComponent(msg)}`, '_blank');

// ── List item ───────────────────────────────────────────────────────────────
function ListItem({ text, positive = true }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: positive ? 'rgba(10,30,74,0.08)' : 'rgba(220,53,69,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon path={positive ? ICONS.check : ICONS.x} size={13} color={positive ? '#0a1e4a' : '#dc3545'} />
      </div>
      <span style={{ fontSize: 14, color: '#3a4a6a', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ── Section heading ─────────────────────────────────────────────────────────
function SectionHead({ tag, title, sub }) {
  return (
    <div style={{ marginBottom: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 12 }}>{tag}</div>
      <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#0a1e4a', margin: '0 0 14px', fontFamily: "'Sora', sans-serif" }}>{title}</h2>
      {sub && <p style={{ color: '#4a5c82', fontSize: 15.5, maxWidth: 560, margin: '0 auto', lineHeight: 1.75, padding: '0 16px' }}>{sub}</p>}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('online');
  const [menuOpen, setMenuOpen] = useState(false);

  // Disable background scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', color: '#0a1e4a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8faff; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f4ff; }
        ::-webkit-scrollbar-thumb { background: #0a1e4a; border-radius: 3px; }
        @keyframes slideDown { from{transform:translateY(-40px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .pricing-cards {
            flex-direction: column;
          }
          .plan-selector-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .pricing-tier-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .value-props-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .footer-links {
            align-items: center;
          }
          .cta-buttons {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .cta-buttons button {
            width: 100%;
            justify-content: center;
          }
          .offline-features-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-contact {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .hero-contact a {
            padding: 8px 0;
          }
        }
      `}</style>

      {/*
        ══ NAV — fixed, with hamburger menu on the right ══
      */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 300,
        height: 'auto',
        minHeight: NAV_H,
        background: '#0a1e4a',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 5vw',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {/* Logo — navigates to LandingPage */}
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
            <span style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" }}>
              MEDCORE<span style={{ color: '#7ec8f7' }}>System</span>
            </span>
          </button>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              minWidth: 44,
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Icon path={menuOpen ? ICONS.close : ICONS.menu} size={24} color="#ffffff" />
          </button>
        </div>
      </header>

      {/* Overlay + Side Menu */}
      {menuOpen && (
        <>
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 301,
              backdropFilter: 'blur(2px)',
              transition: 'all 0.2s',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(280px, 70vw)',
              background: '#0a1e4a',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
              zIndex: 302,
              padding: 'calc(68px + 20px) 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto',
              animation: 'slideDown 0.2s ease-out',
            }}
          >
            {/* Home */}
            <button
              onClick={() => { navigate('/'); closeMenu(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            >
              <Icon path={ICONS.home} size={18} color="currentColor" /> Home
            </button>

            {/* About Us */}
            <button
              onClick={() => { navigate('/aboutusphones'); closeMenu(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            >
              <Icon path={ICONS.users} size={18} color="currentColor" /> About Us
            </button>

            {/* Log in */}
            <button
              onClick={() => { navigate('/login'); closeMenu(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                padding: '12px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            >
              <Icon path={ICONS.arrow} size={18} color="currentColor" /> Log in
            </button>

            {/* Register Free */}
            <button
              onClick={() => { navigate('/clinic-registration'); closeMenu(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: 'none',
                color: '#0a1e4a',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: 12,
                transition: 'opacity 0.2s',
                marginTop: 8,
                width: '100%',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Register Free
            </button>
          </div>
        </>
      )}

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(150deg,#071430 0%,#0a1e4a 50%,#1a3d82 100%)',
        paddingTop: `calc(${NAV_H}px + 40px)`,
        paddingBottom: 'clamp(40px, 12vw, 80px)',
        paddingLeft: '5vw',
        paddingRight: '5vw',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {[500, 700].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        ))}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="pdots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="white" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#pdots)" />
        </svg>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(58,123,213,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 18px', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 24, fontWeight: 600 }}>
            Transparent, Fair Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 16px', fontFamily: "'Sora',sans-serif", padding: '0 12px' }}>
            Simple Pricing That<br /><span style={{ color: '#7ec8f7' }}>Scales with You</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 4vw, 16px)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.75, padding: '0 16px' }}>
            Pay only for what you use. No hidden fees, no surprises — just fair pricing built for Ugandan healthcare.
          </p>
          <div className="hero-contact" style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: ICONS.phone, label: '+256 700 123 456', href: 'tel:+256700123456' },
              { icon: ICONS.phone, label: '+256 700 123 457', href: 'tel:+256700123457' },
              { icon: ICONS.mail,  label: 'MEDCOREug@gmail.com', href: 'mailto:MEDCOREug@gmail.com' },
            ].map(({ icon, label, href }) => (
              <a key={label} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s', padding: '8px 0', minHeight: 44 }}
                onMouseEnter={e => e.currentTarget.style.color = '#7ec8f7'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                <Icon path={icon} size={13} color="currentColor" /> {label}
              </a>
            ))}
          </div>
        </div>
      </section>
  {/*
        ══ PLAN SELECTOR ══
        Redesigned as two large card-style toggle buttons — now stacked on mobile.
      */}
      <section style={{ background: '#f8faff', padding: 'clamp(36px, 8vw, 56px) 5vw 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#3a7bd5', textTransform: 'uppercase', marginBottom: 12 }}>Choose Your Plan</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 900, color: '#0a1e4a', letterSpacing: '-0.02em', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>
            How do you want to run MEDCORE?
          </h2>
          <p style={{ color: '#4a5c82', fontSize: 15, lineHeight: 1.7, marginBottom: 32, padding: '0 16px' }}>
            Pick the deployment that fits your clinic's infrastructure and budget.
          </p>

          {/* Card toggle buttons */}
          <div className="plan-selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
            {/* Online card */}
            <button onClick={() => setActiveTab('online')}
              style={{
                background: activeTab === 'online' ? '#0a1e4a' : '#ffffff',
                border: `2px solid ${activeTab === 'online' ? '#0a1e4a' : 'rgba(10,30,74,0.12)'}`,
                borderRadius: 20,
                padding: '28px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s',
                boxShadow: activeTab === 'online' ? '0 12px 48px rgba(10,30,74,0.28)' : '0 2px 16px rgba(10,30,74,0.07)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
              }}>
              {activeTab === 'online' && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: '#7ec8f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={ICONS.check} size={12} color="#0a1e4a" />
                </div>
              )}
              <div style={{ width: 48, height: 48, borderRadius: 14, background: activeTab === 'online' ? 'rgba(255,255,255,0.12)' : 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon path={ICONS.cloud} size={24} color={activeTab === 'online' ? '#7ec8f7' : '#0a1e4a'} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: activeTab === 'online' ? '#ffffff' : '#0a1e4a', fontFamily: "'Sora',sans-serif", marginBottom: 6 }}>
                Online Subscription
              </div>
              <div style={{ fontSize: 13, color: activeTab === 'online' ? 'rgba(255,255,255,0.6)' : '#6b7a99', lineHeight: 1.55 }}>
                Cloud-based, pay per active day. No hardware needed.
              </div>
              <div style={{ marginTop: 16, display: 'inline-block', background: activeTab === 'online' ? 'rgba(126,200,247,0.15)' : 'rgba(10,30,74,0.06)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: activeTab === 'online' ? '#7ec8f7' : '#0a1e4a', letterSpacing: 0.4 }}>
                From UGX 600 / user / day
              </div>
            </button>

            {/* Offline card */}
            <button onClick={() => setActiveTab('offline')}
              style={{
                background: activeTab === 'offline' ? '#0a1e4a' : '#ffffff',
                border: `2px solid ${activeTab === 'offline' ? '#0a1e4a' : 'rgba(10,30,74,0.12)'}`,
                borderRadius: 20,
                padding: '28px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s',
                boxShadow: activeTab === 'offline' ? '0 12px 48px rgba(10,30,74,0.28)' : '0 2px 16px rgba(10,30,74,0.07)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
              }}>
              {activeTab === 'offline' && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: '#7ec8f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={ICONS.check} size={12} color="#0a1e4a" />
                </div>
              )}
              <div style={{ width: 48, height: 48, borderRadius: 14, background: activeTab === 'offline' ? 'rgba(255,255,255,0.12)' : 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon path={ICONS.server} size={24} color={activeTab === 'offline' ? '#7ec8f7' : '#0a1e4a'} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: activeTab === 'offline' ? '#ffffff' : '#0a1e4a', fontFamily: "'Sora',sans-serif", marginBottom: 6 }}>
                Offline Installation
              </div>
              <div style={{ fontSize: 13, color: activeTab === 'offline' ? 'rgba(255,255,255,0.6)' : '#6b7a99', lineHeight: 1.55 }}>
                On-premises, full control. Ideal for large facilities.
              </div>
              <div style={{ marginTop: 16, display: 'inline-block', background: activeTab === 'offline' ? 'rgba(126,200,247,0.15)' : 'rgba(10,30,74,0.06)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: activeTab === 'offline' ? '#7ec8f7' : '#0a1e4a', letterSpacing: 0.4 }}>
                UGX 3,000,000 one-time
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ══ ONLINE TAB ══ */}
      {activeTab === 'online' && (
        <div style={{ padding: 'clamp(40px, 8vw, 90px) 5vw' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <SectionHead tag="Online Subscription" title="Pay As You Use" sub="Start for a low setup fee, then only pay for the days your staff are actively using the system." />

            {/* Setup fee banner */}
            <div style={{ background: '#0a1e4a', borderRadius: 20, padding: 'clamp(28px, 6vw, 48px)', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7ec8f7', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Initial Setup & Training Fee</div>
                <div style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, color: '#ffffff', fontFamily: "'Sora',sans-serif", letterSpacing: '-1.5px', lineHeight: 1 }}>Contact Us</div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10, maxWidth: 420, lineHeight: 1.65 }}>
                  Setup and training fees vary by clinic size and requirements. Reach out for a personalised quote.
                </p>
                <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                  {[
                    { icon: ICONS.phone, label: '+256 700 123 456', href: 'tel:+256700123456' },
                    { icon: ICONS.phone, label: '+256 700 123 457', href: 'tel:+256700123457' },
                    { icon: ICONS.mail,  label: 'MEDCOREug@gmail.com', href: 'mailto:MEDCOREug@gmail.com' },
                  ].map(({ icon, label, href }) => (
                    <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#7ec8f7', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                      <Icon path={icon} size={15} color="#7ec8f7" /> {label}
                    </a>
                  ))}
                </div>
              </div>
              <button onClick={() => openWhatsApp("Hi! I'd like to know the setup and training fee for MEDCORE.")}
                style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#ffffff', color: '#0a1e4a', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'transform 0.2s', minHeight: 52 }}>
                <Icon path={ICONS.whatsapp} size={18} color="#0a1e4a" /> Chat on WhatsApp
              </button>
            </div>

            {/* Daily pricing tiers */}
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a1e4a', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Daily Active-User Pricing</h3>
            <p style={{ color: '#4a5c82', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
              The system counts total active employees each day and applies one flat rate to all employees based on that total count.
            </p>
            <div className="pricing-tier-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
              {[
                { tier: 'Starter', range: '1 employee',   price: 'UGX 700', sub: 'per employee / day', highlight: false },
                { tier: 'Growth',  range: '2+ employees', price: 'UGX 600', sub: 'per employee / day', highlight: true  },
              ].map(({ tier, range, price, sub, highlight }) => (
                <div key={tier} style={{ background: highlight ? '#0a1e4a' : '#ffffff', borderRadius: 20, padding: '32px 28px', border: `1.5px solid ${highlight ? '#0a1e4a' : 'rgba(10,30,74,0.1)'}`, boxShadow: highlight ? '0 12px 48px rgba(10,30,74,0.25)' : '0 4px 20px rgba(10,30,74,0.07)', position: 'relative', overflow: 'hidden' }}>
                  {highlight && <div style={{ position: 'absolute', top: 16, right: 16, background: '#7ec8f7', color: '#0a1e4a', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5 }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? 'rgba(255,255,255,0.55)' : '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{tier}</div>
                  <div style={{ fontSize: 13, color: highlight ? 'rgba(255,255,255,0.7)' : '#4a5c82', marginBottom: 16 }}>{range}</div>
                  <div style={{ fontSize: 'clamp(2rem, 6vw, 2.8rem)', fontWeight: 900, color: highlight ? '#7ec8f7' : '#0a1e4a', fontFamily: "'Sora',sans-serif", letterSpacing: '-1px', lineHeight: 1 }}>{price}</div>
                  <div style={{ fontSize: 13, color: highlight ? 'rgba(255,255,255,0.5)' : '#8899bb', marginTop: 6 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Example box */}
            <div style={{ background: 'rgba(58,123,213,0.06)', border: '1.5px solid rgba(58,123,213,0.15)', borderRadius: 16, padding: '22px 24px', marginBottom: 40, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10,30,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon path={ICONS.info} size={18} color="#0a1e4a" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0a1e4a', marginBottom: 4, fontSize: 14 }}>Example</div>
                <p style={{ fontSize: 14, color: '#4a5c82', lineHeight: 1.7, margin: 0 }}>
                  If you have <strong>1 active employee</strong> on Monday, that employee is charged at <strong>UGX 700</strong> for that day. If you have <strong>3 active employees</strong> on Tuesday, all 3 are charged at <strong>UGX 600 each</strong> — totalling UGX 1,800 for that day.
                </p>
              </div>
            </div>

            {/* Other charges */}
            <div className="value-props-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}>
              {[
                { title: 'Flexible Balance System', icon: ICONS.zap,  body: 'Load any amount into your MEDCORE account — like mobile money airtime. The system auto-deducts daily usage fees. You receive low-balance alerts, and if your balance hits zero, the system pauses until you top up.' },
                { title: 'AI Features',             icon: ICONS.star, body: 'AI-powered report writing, drug suggestions, employee assessment, and more are currently included at no extra cost.' },
                { title: 'Messaging Charges',       icon: ICONS.mail, body: 'SMS messages: UGX 100–150 per message. WhatsApp messages: UGX 300 per message. Charged only when messages are actually sent.' },
              ].map(({ title, icon, body }) => (
                <div key={title}
                  style={{ background: '#ffffff', borderRadius: 18, padding: '28px 24px', border: '1.5px solid rgba(10,30,74,0.07)', boxShadow: '0 4px 20px rgba(10,30,74,0.06)', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,30,74,0.13)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,30,74,0.06)'}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#0a1e4a' }}>
                    <Icon path={icon} size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0a1e4a', marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>{title}</div>
                  <p style={{ fontSize: 14, color: '#4a5c82', lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>

            {/* Why Online */}
            <div style={{ background: '#0a1e4a', borderRadius: 20, padding: 'clamp(32px, 6vw, 48px)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 14 }}>Why go online?</div>
              <h3 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: 32, fontFamily: "'Sora',sans-serif" }}>6 Reasons to Choose the Cloud</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {[
                  'No upfront hardware costs — save millions vs offline installation',
                  'Automatic updates — always have the latest features at no extra charge',
                  'Power outage protection — runs in the cloud, keeps working when your power fails',
                  'Continuous AI processing — background tasks continue even when your clinic is offline',
                  'Access from anywhere — use on mobile or desktop, inside or outside the clinic',
                  'Pay only for what you use — perfect for clinics with varying staff numbers',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(126,200,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon path={ICONS.check} size={13} color="#7ec8f7" />
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button onClick={() => openWhatsApp("I'm interested in the Online Subscription for MEDCORE. Can you tell me more?")}
                style={{ padding: '16px 32px', borderRadius: 12, border: 'none', background: '#0a1e4a', color: '#ffffff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(10,30,74,0.25)', transition: 'transform 0.2s, box-shadow 0.2s', minHeight: 56, width: 'auto', margin: '0 auto' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(10,30,74,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,30,74,0.25)'; }}>
                <Icon path={ICONS.whatsapp} size={20} color="#5de0a0" /> Get Started Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ OFFLINE TAB ══ */}
      {activeTab === 'offline' && (
        <div style={{ padding: 'clamp(40px, 8vw, 90px) 5vw' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <SectionHead tag="Offline Installation" title="On-Premises, Full Control" sub="A complete installation on your private servers — ideal for large facilities with reliable infrastructure." />

            <div className="offline-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
              {[
                { label: 'One-Time Installation Fee', price: 'UGX 3,000,000', note: 'Includes site assessment, hardware setup, network integration, staff training' },
                { label: 'Annual Maintenance Fee',    price: 'UGX 800,000',   note: 'Covers updates, technical support and system health checks each year' },
              ].map(({ label, price, note }) => (
                <div key={label} style={{ background: '#0a1e4a', borderRadius: 20, padding: '36px 32px', boxShadow: '0 12px 48px rgba(10,30,74,0.22)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7ec8f7', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
                  <div style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', fontWeight: 900, color: '#ffffff', fontFamily: "'Sora',sans-serif", letterSpacing: '-1px', lineHeight: 1, marginBottom: 12 }}>{price}</div>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{note}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, marginBottom: 48 }}>
              <div style={{ background: '#ffffff', borderRadius: 20, padding: '32px 28px', border: '1.5px solid rgba(10,30,74,0.07)', boxShadow: '0 4px 20px rgba(10,30,74,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0a1e4a', marginBottom: 24, fontFamily: "'Sora',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon path={ICONS.shield} size={16} color="#0a1e4a" />
                  </div>
                  What's Included
                </div>
                {[
                  'Complete on-premises installation on your private servers',
                  'Technical wiring and connection of all facility computers',
                  'Unlimited users — one flat rate regardless of facility size',
                  'Complete control over all your data — no external cloud storage',
                  'Greater potential for system customisation to your exact needs',
                  'Messaging: SMS (UGX 100–150) and WhatsApp (UGX 300) per message',
                ].map((t, i) => <ListItem key={i} text={t} positive />)}
              </div>
              <div style={{ background: '#ffffff', borderRadius: 20, padding: '32px 28px', border: '1.5px solid rgba(10,30,74,0.07)', boxShadow: '0 4px 20px rgba(10,30,74,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0a1e4a', marginBottom: 24, fontFamily: "'Sora',sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(220,53,69,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon path={ICONS.info} size={16} color="#dc3545" />
                  </div>
                  Considerations
                </div>
                {[
                  'Higher upfront cost — requires significant initial investment',
                  'Vulnerable to power outages — system goes down when your power fails',
                  'Manual updates required — may incur additional costs for major upgrades',
                  'Fixed location — only accessible from connected clinic computers',
                  'Annual maintenance fee — required regardless of usage levels',
                ].map((t, i) => <ListItem key={i} text={t} positive={false} />)}
              </div>
            </div>

            <div style={{ background: 'rgba(10,30,74,0.03)', borderRadius: 20, padding: '36px 32px', border: '1.5px solid rgba(10,30,74,0.08)', marginBottom: 48 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0a1e4a', marginBottom: 24, fontFamily: "'Sora',sans-serif" }}>Who Should Choose Offline?</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 12 }}>
                {[
                  'Large facilities with very consistent, high daily usage',
                  'Clinics with reliable power and IT infrastructure',
                  'Organisations with strict data residency requirements',
                  'Facilities needing deep system customisation',
                  'Clinics in areas with unreliable internet connectivity',
                ].map((t, i) => <ListItem key={i} text={t} positive />)}
              </div>
            </div>

            <div style={{ background: '#0a1e4a', borderRadius: 20, padding: '32px 28px', marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 12 }}>Implementation</div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                Our offline installation includes a site assessment by technicians, hardware setup and configuration, network integration of all workstations, comprehensive staff training, and ongoing support — all completed within a streamlined implementation timeline.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => openWhatsApp("I'm interested in Offline Installation for MEDCORE. Can you provide more details?")}
                style={{ padding: '16px 32px', borderRadius: 12, border: 'none', background: '#0a1e4a', color: '#ffffff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(10,30,74,0.25)', transition: 'transform 0.2s', minHeight: 56, width: 'auto', margin: '0 auto' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <Icon path={ICONS.whatsapp} size={20} color="#5de0a0" /> Request Offline Installation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Value Props ══ */}
      <section style={{ padding: 'clamp(40px, 8vw, 80px) 5vw', background: '#ffffff', borderTop: '1px solid rgba(10,30,74,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHead tag="Why MEDCORE" title="What Sets Us Apart" />
          <div className="value-props-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 22 }}>
            {[
              { title: 'Fair Pricing',         icon: ICONS.star,   body: 'Tiered pricing ensures larger facilities get better rates. Our active-user model means you never pay for unused licences.' },
              { title: 'Professional Support', icon: ICONS.shield,  body: 'Our team is quick to respond and always available when you need us. We pride ourselves on professional, timely service.' },
              { title: 'Cutting-Edge AI',      icon: ICONS.zap,    body: 'Included AI capabilities and automated messaging put MEDCORE ahead of competitors at a fraction of the cost.' },
              { title: 'Flexible Options',     icon: ICONS.cloud,  body: 'Choose the deployment method that works best — cloud-based for convenience, or on-premises for full control.' },
            ].map(({ title, icon, body }) => (
              <div key={title}
                style={{ background: '#f8faff', borderRadius: 18, padding: '28px 24px', border: '1.5px solid rgba(10,30,74,0.07)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(10,30,74,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(10,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: '#0a1e4a' }}>
                  <Icon path={icon} size={21} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0a1e4a', marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>{title}</div>
                <p style={{ fontSize: 14, color: '#4a5c82', lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Final CTA ══ */}
      <section style={{ background: 'linear-gradient(150deg,#071430,#0a1e4a,#1a3d82)', padding: 'clamp(48px, 10vw, 100px) 5vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 16px', fontFamily: "'Sora',sans-serif" }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 36, lineHeight: 1.75, padding: '0 16px' }}>
            Contact our team for a personalised consultation and see how MEDCORE can work for your clinic.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => openWhatsApp("I'd like to learn more about MEDCORE. Can we schedule a consultation?")}
              style={{ padding: '15px 32px', borderRadius: 12, border: 'none', background: '#ffffff', color: '#0a1e4a', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', transition: 'transform 0.2s', minHeight: 52 }}>
              <Icon path={ICONS.whatsapp} size={18} color="#0a1e4a" /> Contact Sales
            </button>
            <button onClick={() => navigate('/clinic-registration')}
              style={{ padding: '15px 32px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', minHeight: 52 }}>
              Register Free <Icon path={ICONS.arrow} size={16} color="#ffffff" />
            </button>
          </div>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer style={{ background: '#06121f', padding: 'clamp(32px, 6vw, 60px) 5vw 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <button onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, justifyContent: 'center', width: '100%' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0a1e4a', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={ICONS.heart} size={15} color="#7ec8f7" />
                </div>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', fontFamily: "'Sora',sans-serif" }}>
                  MEDCORE<span style={{ color: '#7ec8f7' }}>System</span>
                </span>
              </button>
              <p style={{ fontSize: 13.5, color: '#445577', lineHeight: 1.8, textAlign: 'center' }}>Modern AI-powered clinic management. Built for Uganda.</p>
            </div>
            <div className="footer-links" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 18 }}>Quick Links</div>
              {[
                ['Home',          () => navigate('/')],
                ['About Us',      () => navigate('/aboutusphones')],
                ['Register Free', () => navigate('/clinic-registration')],
                ['Log in',        () => navigate('/login')],
              ].map(([l, fn]) => (
                <button key={l} onClick={fn}
                  style={{ display: 'block', fontSize: 14, color: '#445577', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', textAlign: 'center', transition: 'color 0.2s', minHeight: 44 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#445577'}>{l}</button>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: '#7ec8f7', textTransform: 'uppercase', marginBottom: 18 }}>Contact</div>
              <p style={{ fontSize: 14, color: '#445577', lineHeight: 2.1 }}>
                +256 700 123 456<br />+256 700 123 457<br />MEDCOREug@gmail.com
              </p>
              <button onClick={() => openWhatsApp("Hi, I'd like to chat about MEDCORE.")}
                style={{ marginTop: 16, padding: '10px 20px', borderRadius: 9, border: 'none', background: '#0a1e4a', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'background 0.2s', boxShadow: '0 2px 12px rgba(10,30,74,0.4)', minHeight: 44 }}
                onMouseEnter={e => e.currentTarget.style.background = '#142d6e'}
                onMouseLeave={e => e.currentTarget.style.background = '#0a1e4a'}>
                <Icon path={ICONS.whatsapp} size={14} color="#5de0a0" /> Chat on WhatsApp
              </button>
            </div>
          </div>
          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#2a3a55', width: '100%' }}>© 2025 MEDCORE. All rights reserved.</span>
            <span style={{ fontSize: 13, color: '#2a3a55', width: '100%' }}>Built with ❤ in Uganda</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
