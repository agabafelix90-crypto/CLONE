import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComplianceGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7f9ff', color: '#102a43', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', background: '#ffffff', borderRadius: 24, boxShadow: '0 24px 80px rgba(16,42,67,0.08)', padding: '48px 38px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 24, border: 'none', background: '#ebf3ff', color: '#102a43', padding: '12px 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>
          ← Back
        </button>

        <h1 style={{ fontSize: 'clamp(2rem, 3vw, 3.2rem)', color: '#0b2447', marginBottom: 12, fontWeight: 900, lineHeight: 1.05 }}>
          MoH Digital Health Compliance
        </h1>
        <p style={{ color: '#486581', marginBottom: 32, fontSize: 15 }}>
          MediCore System Compliance with Uganda Ministry of Health Guidelines for Digital Health Solutions.
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>1. Registration Status</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            MediCore System is registered with the Digital Health Subcommittee (DHSC) under the Health Information Innovation and Research Technical Working Group (HIIRE TWG).
          </p>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Additionally, as an Information Technology solution, MediCore System complies with the National Information Technology Policy for Uganda (2010), which provides the foundational framework for IT development in the country.
          </p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Registration ID: [To be assigned by DHSC]</li>
            <li>Registration Date: [Current Date]</li>
            <li>Status: Under Review</li>
            <li>IT Policy Compliance: Aligned with 2010 National IT Policy objectives</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>2. Assessment Criteria Compliance</h2>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 10, fontWeight: 700, color: '#102a43' }}>2.1 Data Protection (Section C1)</h3>
            <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>✅ Compliant with Data Protection and Privacy Act 2019</li>
              <li>✅ Implements encryption for data in transit and at rest</li>
              <li>⚠️ Data currently hosted on external infrastructure; planned migration to local Ugandan servers</li>
              <li>✅ User consent obtained during registration</li>
            </ul>
          </div>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 10, fontWeight: 700, color: '#102a43' }}>2.2 Technical Security (Section C2)</h3>
            <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>✅ External penetration testing completed (OWASP Top 10)</li>
              <li>✅ Code security review conducted</li>
              <li>✅ Audit logging implemented</li>
              <li>✅ Load testing performed</li>
              <li>✅ Regular security updates and patches</li>
            </ul>
          </div>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 10, fontWeight: 700, color: '#102a43' }}>2.3 Interoperability (Section C3)</h3>
            <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>✅ RESTful APIs available for integration</li>
              <li>✅ Supports HL7 FHIR standards for health data exchange</li>
              <li>✅ Compatible with DHIS2 for HMIS data transmission</li>
              <li>✅ Unique patient identifiers implemented</li>
              <li>✅ Secure OAuth 2.0 authentication for API access</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 10, fontWeight: 700, color: '#102a43' }}>2.4 Usability & Accessibility (Section D1)</h3>
            <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>✅ User-centered design with healthcare worker input</li>
              <li>✅ User acceptance testing completed</li>
              <li>✅ Multi-disciplinary development team</li>
              <li>✅ Agile development methodology</li>
              <li>✅ Continuous iteration based on user feedback</li>
              <li>✅ WCAG 2.1 AA accessibility compliance</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>3. Data Localization Plan</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Recognizing the importance of data sovereignty under the guidelines, MediCore System is committed to local data hosting:
          </p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Local data center strategy aligned with Uganda ICT policy</li>
            <li>Encrypted backups and strong access controls</li>
            <li>Full migration plan for sensitive health records</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>4. Integration with National Systems</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            MediCore System is designed to integrate seamlessly with:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>DHIS2 for HMIS reporting</li>
            <li>National patient identifier schemes</li>
            <li>Secure health data exchange standards</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>5. Contact Information</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            For compliance-related inquiries:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Email: compliance@MediCore System.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>Address: Kampala, Uganda</li>
          </ul>
        </section>

        <div style={{ background: '#f0f6ff', borderRadius: 18, border: '1px solid #d9e8ff', padding: 24, marginTop: 18 }}>
          <p style={{ margin: 0, color: '#102a43', fontWeight: 700 }}>
            MediCore System is committed to continuous compliance with Uganda's National ICT Policy 2022 and the Ministry of Health digital health guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceGuidelines;
