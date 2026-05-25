import React from 'react';

const page = {
  background: '#f3f7ff',
  color: '#0a1e4a',
  padding: '3rem 2rem',
};
const container = { maxWidth: 1180, margin: '0 auto' };
const label = { textTransform: 'uppercase', letterSpacing: 2.5, color: '#5b6a85', fontSize: '0.85rem', marginBottom: 12 };
const heroTitle = { fontSize: '3.4rem', lineHeight: 1.03, margin: 0, letterSpacing: '-0.04em' };
const heroText = { fontSize: '1.05rem', lineHeight: 1.85, color: '#33415f', margin: '1.5rem 0 0' };
const sectionHeading = { fontSize: '2rem', margin: '0 0 1rem', color: '#0a1e4a' };
const card = { background: '#ffffff', borderRadius: 24, boxShadow: '0 24px 60px rgba(15, 50, 100, 0.08)', padding: '1.8rem' };
const paragraph = { margin: 0, lineHeight: 1.85, color: '#4d5f7f' };
const subheading = { fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.9rem', color: '#1f3d7a' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' };
const statCard = { background: '#eef4ff', borderRadius: 20, padding: '1.6rem', textAlign: 'center' };
const statNumber = { fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0a1e4a' };
const statLabel = { fontSize: '0.95rem', color: '#5f6f8c' };
const highlight = { color: '#0a1e4a', fontWeight: 700 };
const button = { border: 'none', borderRadius: 999, background: '#0a1e4a', color: '#ffffff', padding: '1rem 1.8rem', cursor: 'pointer', fontWeight: 700, marginTop: '1rem' };

function AboutUs() {
  return (
    <div style={page}>
      <div style={container}>
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem', alignItems: 'start' }}>
            <div>
              <p style={label}>ClinicProSystem / About Us</p>
              <h1 style={heroTitle}>Modern clinic management for Uganda’s healthcare teams.</h1>
              <p style={heroText}>
                ClinicProSystem grew from frontline clinic frustration into a tool that transforms workflow, patient care, and financial management for clinics across Uganda.
              </p>
            </div>
            <div style={{ ...card, border: '1px solid rgba(10, 30, 74, 0.05)' }}>
              <p style={{ margin: 0, color: '#5b6a85', textTransform: 'uppercase', letterSpacing: 1.8, fontSize: '0.86rem' }}>Built for busy clinics</p>
              <h2 style={{ margin: '1rem 0 0', fontSize: '1.7rem', color: '#0a1e4a' }}>Founded April 1, 2024</h2>
              <p style={{ marginTop: '1rem', ...paragraph }}>From the first line of code to our first clinic launch, every decision has been guided by real clinic needs.</p>
              <div style={{ marginTop: '1.6rem', display: 'grid', gap: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#33415f' }}><span>First line of code</span><strong>March 2024</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#33415f' }}><span>First clinic live</span><strong>June 2024</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#33415f' }}><span>Official launch</span><strong>April 2025</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.75rem' }}>
          <h2 style={sectionHeading}>Our Story</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={card}>
              <h3 style={subheading}>Why We Built This</h3>
              <p style={paragraph}>
                In early 2024, while working in a busy urban clinic, FELIX AGABA and Jenny witnessed firsthand the administrative chaos that plagues healthcare facilities. Missing files, forgotten appointments, repetitive tiring activities, poor statistical data collection, and uncollected payments weren't just inconveniences — they were barriers to quality patient care.
              </p>
              <p style={paragraph}>
                After months of frustration watching these systemic issues waste staff time and compromise patient outcomes, we decided to build a solution that would address the root causes rather than just the symptoms.
              </p>
            </div>
            <div style={card}>
              <h3 style={subheading}>Our Journey</h3>
              <p style={paragraph}><span style={highlight}>March 2024</span> — First line of code, built from the daily realities of clinic staff.</p>
              <p style={paragraph}><span style={highlight}>June 2024</span> — First clinic implementation, refined with live feedback.</p>
              <p style={paragraph}><span style={highlight}>April 2025</span> — Official launch as a company serving clinics nationwide.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.75rem' }}>
          <h2 style={sectionHeading}>The Team</h2>
          <div style={statsGrid}>
            <div style={card}>
              <p style={{ margin: 0, ...label, letterSpacing: 1.5 }}>Founder & Lead Developer</p>
              <h3 style={{ margin: '1rem 0 0.8rem', fontSize: '1.6rem', color: '#0a1e4a' }}>FELIX AGABA</h3>
              <p style={paragraph}>Software Engineering · Healthcare Operations · System Architecture</p>
              <p style={paragraph}>With a background in both healthcare and software engineering, FELIX brings a unique perspective to clinic management. He knows exactly where clinic systems need to be stronger.</p>
            </div>
            <div style={card}>
              <p style={{ margin: 0, ...label, letterSpacing: 1.5 }}>Co-Founder & Operations Lead</p>
              <h3 style={{ margin: '1rem 0 0.8rem', fontSize: '1.6rem', color: '#0a1e4a' }}>ASIO ANN REBECCA</h3>
              <p style={paragraph}>Clinic Finance · Patient Relations · Operations Management</p>
              <p style={paragraph}>Jenny's front-line experience in clinic finance and patient communication makes sure our solutions work in everyday practice.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.75rem' }}>
          <h2 style={sectionHeading}>Gratitude & Values</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={card}>
              <p style={{ margin: 0, ...label, letterSpacing: 1.5 }}>Early Clinic Partners</p>
              <p style={paragraph}><strong>Madam Getrude</strong> — CEO, LIFESURE MEDICARE</p>
              <p style={paragraph}>Her facility became our proving ground, allowing us to discover crucial gaps and improve the product quickly.</p>
              <p style={paragraph}><strong>Madam Sarah Kikajjo</strong> — Director, Health Center & Maternity Home</p>
              <p style={paragraph}>Her trust in our early application gave us the confidence to build a service clinics could rely on.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Healthcare First', detail: 'Every feature supports better patient outcomes.' },
                { title: 'Practical Innovation', detail: 'If it doesn’t work in a busy clinic, it doesn’t belong here.' },
                { title: 'Partnership Approach', detail: 'We help clients succeed without locking them in.' },
              ].map((item) => (
                <div key={item.title} style={{ ...card, padding: '1.5rem' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.75rem', color: '#0a1e4a' }}>{item.title}</h3>
                  <p style={paragraph}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2.75rem' }}>
          <h2 style={sectionHeading}>Impact</h2>
          <div style={statsGrid}>
            {[
              { value: '12+', label: 'Clinics Transformed' },
              { value: '100%', label: 'Client Retention Rate' },
              { value: '40%', label: 'Fewer Missed Appointments' },
              { value: '60%', label: 'Improved Clinic Management' },
            ].map((item) => (
              <div key={item.label} style={statCard}>
                <div style={statNumber}>{item.value}</div>
                <div style={statLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 0 }}>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <p style={label}>Ready to join our journey?</p>
              <h2 style={{ margin: 0, fontSize: '2rem', color: '#0a1e4a' }}>Let’s transform clinic management together.</h2>
            </div>
            <p style={paragraph}>If you are ready to modernize your clinic, we are ready to bring the same practical, clinician-led approach to your team.</p>
            <button style={button}>View Pricing</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutUs;
