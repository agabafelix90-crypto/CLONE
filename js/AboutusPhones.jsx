import React from 'react';

const page = { background: '#f3f7ff', color: '#0a1e4a', padding: '1.75rem 1rem 2.5rem' };
const container = { maxWidth: 780, margin: '0 auto' };
const label = { textTransform: 'uppercase', letterSpacing: 2, color: '#5b6a85', fontSize: '0.8rem', marginBottom: 10 };
const heading = { fontSize: '2rem', margin: '0 0 0.75rem', color: '#0a1e4a' };
const paragraph = { margin: 0, lineHeight: 1.85, color: '#4d5f7f', marginBottom: '1rem' };
const card = { background: '#ffffff', borderRadius: 22, boxShadow: '0 18px 45px rgba(15, 50, 100, 0.08)', padding: '1.35rem', marginBottom: '1rem' };
const statCard = { background: '#eef4ff', borderRadius: 18, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' };
const statValue = { fontSize: '1.6rem', fontWeight: 800, color: '#0a1e4a' };
const statLabel = { fontSize: '0.9rem', color: '#5f6f8c' };

function AboutusPhones() {
  return (
    <div style={page}>
      <div style={container}>
        <header style={{ marginBottom: '2rem' }}>
          <p style={label}>ClinicProSystem</p>
          <h1 style={heading}>About Us</h1>
          <p style={paragraph}>Modern AI-powered clinic management built for Uganda’s clinics.</p>
        </header>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>Our Story</h2>
          <p style={paragraph}>How two healthcare professionals turned everyday frustration into a platform that transforms clinics across Uganda.</p>
          <p style={paragraph}>In early 2024, while working in a busy urban clinic, FELIX AGABA and Jenny witnessed firsthand the administrative chaos that plagues healthcare facilities.</p>
          <p style={paragraph}>After months of frustration watching these issues waste staff time and compromise patient outcomes, we decided to build a solution that would address the root causes.</p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>The Team</h2>
          <p style={paragraph}><strong>FELIX AGABA</strong> — Founder & Lead Developer</p>
          <p style={paragraph}>With a background in both healthcare and software engineering, FELIX brings a unique perspective to clinic management solutions.</p>
          <p style={paragraph}><strong>ASIO ANN REBECCA</strong> — Co-Founder & Operations Lead</p>
          <p style={paragraph}>Her front-line experience in clinic finance and patient relations ensures the platform works in real-world clinics.</p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>Our Values</h2>
          <p style={paragraph}><strong>Healthcare First</strong> — Every feature supports better patient outcomes.</p>
          <p style={paragraph}><strong>Practical Innovation</strong> — If it does not work in a busy clinic, it does not belong in our system.</p>
          <p style={paragraph}><strong>Partnership Approach</strong> — We grow by helping our clients succeed, not by locking them into restrictive contracts.</p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>Journey</h2>
          <p style={paragraph}><strong>March 2024</strong> — First Line of Code</p>
          <p style={paragraph}><strong>June 2024</strong> — First Clinic Goes Live</p>
          <p style={paragraph}><strong>April 2025</strong> — Official Company Launch</p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>Impact</h2>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {[
              { value: '12+', label: 'Clinics Transformed' },
              { value: '100%', label: 'Client Retention Rate' },
              { value: '40%', label: 'Fewer Missed Appointments' },
              { value: '60%', label: 'Improved Clinic Management' },
            ].map((item) => (
              <div key={item.label} style={statCard}>
                <div>
                  <div style={statValue}>{item.value}</div>
                  <div style={statLabel}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', color: '#0a1e4a' }}>Join Our Story</h2>
          <p style={paragraph}>We are always looking to partner with clinics that share our vision for better healthcare through smarter management.</p>
          <button style={{ border: 'none', borderRadius: 999, background: '#0a1e4a', color: '#ffffff', padding: '1rem 1.5rem', cursor: 'pointer', fontWeight: 700, marginTop: '1rem' }}>View Pricing</button>
        </div>
      </div>
    </div>
  );
}

export default AboutusPhones;
