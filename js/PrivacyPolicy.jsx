import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7f9ff', color: '#102a43', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#ffffff', borderRadius: 24, boxShadow: '0 24px 80px rgba(16,42,67,0.08)', padding: '48px 38px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 24, border: 'none', background: '#ebf3ff', color: '#102a43', padding: '12px 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw, 3.2rem)', color: '#0b2447', marginBottom: 12, fontWeight: 900, lineHeight: 1.05 }}>Privacy Policy</h1>
        <p style={{ color: '#486581', marginBottom: 32, fontSize: 15 }}>
          Last updated: March 26, 2026
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>1. Introduction</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            MediCore System ("we," "our," or "us") is committed to protecting your privacy and ensuring compliance with Uganda's Data Protection and Privacy Act 2019 and the National ICT Policy 2022. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare management platform.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>2. Information We Collect</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>We collect information you provide directly to us, such as:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Account information (name, email, phone number)</li>
            <li>Patient health records and medical data</li>
            <li>Clinic operational data</li>
            <li>Payment information</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>3. How We Use Your Information</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We use collected information to:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Provide and maintain our healthcare management services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Ensure compliance with healthcare regulations and data protection laws</li>
            <li>Improve our services and develop new features</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>4. Data Security and Protection</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits. We comply with Uganda's cybersecurity standards and the National Information Security Framework (NISF).
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>5. Data Sharing and Disclosure</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or required by law. We may share information with healthcare regulators, law enforcement, or in response to legal requests.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>6. Data Localization</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            In alignment with Uganda's National ICT Policy 2022 and Ministry of Health Guidelines for Digital Health Solutions, we are committed to data localization. Currently, data is securely stored using Google Cloud Platform and Firebase infrastructure with appropriate safeguards. We are actively working on migrating to local Ugandan data centers to ensure data remains within Uganda's geographical borders.
          </p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Google Cloud encrypted storage with compliance monitoring</li>
            <li>Migration to Ugandan-certified data centers</li>
            <li>Full compliance with national data sovereignty requirements</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>7. Your Rights</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Under the Data Protection and Privacy Act 2019, you have the right to access, correct, delete, or export your personal data, and to withdraw consent where applicable. You may also request that we restrict or object to certain processing operations.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>8. Cookies and Tracking</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized services. You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>9. Children's Privacy</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>10. Changes to This Policy</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>11. Contact Us</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            If you have any questions about this Privacy Policy, please contact us at:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Email: info@MediCore System.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>Address: Kampala, Uganda</li>
          </ul>
        </section>

        <section style={{ marginTop: 32 }}>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            This Privacy Policy is designed to comply with Uganda's National ICT Policy 2022, Data Protection and Privacy Act 2019, and other relevant regulations. We are committed to promoting digital inclusion, cybersecurity, and consumer protection as outlined in the policy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
