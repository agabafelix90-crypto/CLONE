import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f7f9ff', color: '#102a43', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#ffffff', borderRadius: 24, boxShadow: '0 24px 80px rgba(16,42,67,0.08)', padding: '48px 38px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 24, border: 'none', background: '#ebf3ff', color: '#102a43', padding: '12px 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw, 3.2rem)', color: '#0b2447', marginBottom: 12, fontWeight: 900, lineHeight: 1.05 }}>Terms of Service</h1>
        <p style={{ color: '#486581', marginBottom: 32, fontSize: 15 }}>Last updated: March 26, 2026</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>1. Acceptance of Terms</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            By accessing and using MediCoreSystem ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use the Service.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>2. Description of Service</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            MediCoreSystem is a comprehensive healthcare management platform designed to assist clinics and healthcare facilities in managing patient records, appointments, pharmacy operations, laboratory data, and other healthcare-related functions. The service is provided in compliance with Uganda's National ICT Policy 2022 and relevant healthcare regulations.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>3. User Accounts</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>4. Acceptable Use</h2>
          <p style={{ color: '#486581', lineHeight: 1.8, marginBottom: 12 }}>
            You agree not to use the Service to:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe on the rights of others.</li>
            <li>Transmit harmful or malicious code.</li>
            <li>Attempt to gain unauthorized access to our systems.</li>
            <li>Use the service for any illegal healthcare practices.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>5. Data Privacy and Protection</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Your use of the Service is also governed by our Privacy Policy. We are committed to protecting patient data and complying with Uganda's Data Protection and Privacy Act 2019. All healthcare data is handled with the highest standards of confidentiality and security.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>6. Intellectual Property</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            The Service and its original content, features, and functionality are and will remain the exclusive property of MediCoreSystem and its licensors. The service is protected by copyright, trademark, and other laws.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>7. Payment Terms</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            Some features of the Service require payment. By subscribing to a paid plan, you agree to pay all applicable fees. Fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days' notice.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>8. Termination</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>9. Limitation of Liability</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            In no event shall MediCoreSystem be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>10. Governing Law</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            These Terms shall be interpreted and governed by the laws of Uganda, in accordance with the National ICT Policy 2022 and other relevant legislation.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>11. Changes to Terms</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            We reserve the right to modify these Terms at any time. We will notify users of any changes via email or through the Service.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>12. Contact Information</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            If you have any questions about these Terms, please contact us at:</p>
          <ul style={{ color: '#486581', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Email: legal@medicoresystem.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>Address: Kampala, Uganda</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', color: '#102a43', marginBottom: 12, fontWeight: 700 }}>13. Compliance with Ugandan Regulations</h2>
          <p style={{ color: '#486581', lineHeight: 1.8 }}>
            MediCoreSystem is developed and operated in compliance with Uganda's National ICT Policy 2022, promoting digital transformation, cybersecurity, inclusivity, and fair competition in the healthcare sector.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
