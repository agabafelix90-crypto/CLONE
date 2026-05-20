import React from 'react';
import { useNavigate } from 'react-router-dom';

const Icon = ({ path, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d={path} />
  </svg>
);

const ICONS = {
  arrow: 'M5 12h14M12 5l7 7-7 7',
  check: 'M20 6L9 17l-5-5',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
};

const FEATURES = [
  { icon: 'check', title: 'Smart Appointments', desc: 'Auto reminders and easy rescheduling keep patients on time.' },
  { icon: 'check', title: 'Secure Records', desc: 'Digital patient files with fast access and better audits.' },
  { icon: 'check', title: 'Billing Made Simple', desc: 'Collections, invoices and inventory all in one place.' },
];

const TESTIMONIALS = [
  { text: 'MEDCORE has made running our clinic effortless. Patients love the smooth check-in process.', name: 'Dr. Amina', role: 'Matron, Hope Clinic' },
  { text: 'We now follow up with patients automatically and our no-show rate has dropped dramatically.', name: 'Mr. Peter', role: 'Clinic Manager' },
];

const LandingPagePhones = () => {
  const navigate = useNavigate();

  const openDemo = () => window.open('https://wa.me/2567526488446?text=Hi!%20I%20am%20interested%20in%20a%20MEDCORE%20demo.', '_blank');

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f8faff', minHeight: '100vh', color: '#0a1e4a' }}>
      <header style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a1e4a', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1e4a', fontWeight: 800, fontSize: 18 }}>MC</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>MEDCORE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Clinic Management</div>
          </div>
        </div>
        <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, color: '#ffffff', padding: '10px 16px', fontWeight: 700 }}>Login</button>
      </header>

      <main style={{ padding: '24px 16px' }}>
        <section style={{ background: '#ffffff', borderRadius: 28, padding: '26px 18px', boxShadow: '0 18px 60px rgba(14,38,83,0.08)' }}>
          <div style={{ fontSize: 14, color: '#3a7bd5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Built for clinics in Uganda</div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 18px', lineHeight: 1.08 }}>Manage patients, billing and appointments with MEDCORE.</h1>
          <p style={{ color: '#556a8a', marginBottom: 22, lineHeight: 1.7 }}>Everything your clinic needs in one mobile-friendly platform � from patient records to automated health reminders and financial reports.</p>
          <div style={{ display: 'grid', gap: 12 }}>
            <button onClick={() => navigate('/clinic-registration')} style={{ border: 'none', borderRadius: 14, background: '#0a1e4a', color: '#ffffff', padding: '16px', fontSize: 15, fontWeight: 700 }}>Start Free Trial</button>
            <button onClick={openDemo} style={{ border: '1.5px solid #0a1e4a', borderRadius: 14, background: 'transparent', padding: '16px', fontSize: 15, fontWeight: 700, color: '#0a1e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon path={ICONS.whatsapp} size={18} color='#0a1e4a' /> Book WhatsApp Demo</button>
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, color: '#3a7bd5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Why MEDCORE?</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0a1e4a', marginTop: 6 }}>Fast, simple and powerful.</div>
            </div>
            <span style={{ color: '#0a1e4a', fontWeight: 700 }}>Trusted by clinics</span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: '#ffffff', borderRadius: 22, padding: '18px', boxShadow: '0 6px 24px rgba(14,38,83,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1e4a' }}><Icon path={ICONS[icon]} size={20} /></div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0a1e4a' }}>{title}</div>
                </div>
                <p style={{ margin: 0, color: '#5e728f', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 26, background: '#ffffff', borderRadius: 28, padding: '22px', boxShadow: '0 12px 30px rgba(14,38,83,0.08)' }}>
          <div style={{ fontSize: 14, color: '#3a7bd5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Customer Stories</div>
          <div style={{ display: 'grid', gap: 14 }}>
            {TESTIMONIALS.map(({ text, name, role }, index) => (
              <div key={index} style={{ background: '#f8fbff', borderRadius: 20, padding: '18px' }}>
                <p style={{ margin: '0 0 14px', color: '#2b3a51', lineHeight: 1.7 }}>&ldquo;{text}&rdquo;</p>
                <div style={{ fontWeight: 700, color: '#0a1e4a' }}>{name}</div>
                <div style={{ fontSize: 13, color: '#6e7c95' }}>{role}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 26, padding: '20px', background: '#0a1e4a', borderRadius: 28, color: '#ffffff' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#5de0a0', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Ready for MEDCORE?</div>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}>Launch your clinic's digital transformation.</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginBottom: 18 }}>Start managing patients, payments and clinical workflows with fewer clicks and brighter outcomes.</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <button onClick={() => navigate('/clinic-registration')} style={{ border: 'none', borderRadius: 14, background: '#ffffff', color: '#0a1e4a', padding: '16px', fontWeight: 800 }}>Register Free</button>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Contact: +256 752 648844<br />support@medcore.africa
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPagePhones;
