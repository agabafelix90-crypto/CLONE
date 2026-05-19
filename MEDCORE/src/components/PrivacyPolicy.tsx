import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: March 26, 2026
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none text-foreground"
        >
          <h2>1. Introduction</h2>
          <p>
            MediCoreSystem ("we," "our," or "us") is committed to protecting your privacy and ensuring compliance with Uganda's Data Protection and Privacy Act 2019 and the National ICT Policy 2022. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare management platform.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as:</p>
          <ul>
            <li>Account information (name, email, phone number)</li>
            <li>Patient health records and medical data</li>
            <li>Clinic operational data</li>
            <li>Payment information</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain our healthcare management services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Ensure compliance with healthcare regulations and data protection laws</li>
            <li>Improve our services and develop new features</li>
          </ul>

          <h2>4. Data Security and Protection</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits. We comply with Uganda's cybersecurity standards and the National Information Security Framework (NISF).
          </p>

          <h2>5. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or required by law. We may share information with healthcare regulators, law enforcement, or in response to legal requests.
          </p>

          <h2>6. Data Localization</h2>
          <p>
            In alignment with Uganda's National ICT Policy 2022 and Ministry of Health Guidelines for Digital Health Solutions, we are committed to data localization. Currently, data is securely stored using **Google Cloud Platform and Firebase infrastructure** with appropriate safeguards. We are actively working on migrating to local Ugandan data centers to ensure all data remains within Uganda's geographical borders.
          </p>
          <p><strong>Data Localization Roadmap:</strong></p>
          <ul>
            <li><strong>Phase 1 (Current):</strong> Google Cloud encrypted storage with compliance monitoring</li>
            <li><strong>Phase 2 (3 months):</strong> Migration to Ugandan-certified data centers</li>
            <li><strong>Phase 3 (6 months):</strong> Full compliance with national data sovereignty requirements</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>Under the Data Protection and Privacy Act 2019, you have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized services. You can control cookie preferences through your browser settings.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 18. We do not knowingly collect personal information from children under 18.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@medicoresystem.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>Address: Kampala, Uganda</li>
          </ul>

          <h2>12. Compliance with Ugandan Law</h2>
          <p>
            This Privacy Policy is designed to comply with Uganda's National ICT Policy 2022, Data Protection and Privacy Act 2019, and other relevant regulations. We are committed to promoting digital inclusion, cybersecurity, and consumer protection as outlined in the policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;