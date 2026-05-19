import { motion } from "framer-motion";

const TermsOfService = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Terms of Service
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
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using MediCoreSystem ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            MediCoreSystem is a comprehensive healthcare management platform designed to assist clinics and healthcare facilities in managing patient records, appointments, pharmacy operations, laboratory data, and other healthcare-related functions. The service is provided in compliance with Uganda's National ICT Policy 2022 and relevant healthcare regulations.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Transmit harmful or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use the service for any illegal healthcare practices</li>
          </ul>

          <h2>5. Data Privacy and Protection</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We are committed to protecting patient data and complying with Uganda's Data Protection and Privacy Act 2019. All healthcare data is handled with the highest standards of confidentiality and security.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of MediCoreSystem and its licensors. The service is protected by copyright, trademark, and other laws.
          </p>

          <h2>7. Payment Terms</h2>
          <p>
            Some features of the Service require payment. By subscribing to a paid plan, you agree to pay all applicable fees. Fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days' notice.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            In no event shall MediCoreSystem be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of Uganda, in accordance with the National ICT Policy 2022 and other relevant legislation.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any changes via email or through the Service.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <ul>
            <li>Email: legal@medicoresystem.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>Address: Kampala, Uganda</li>
          </ul>

          <h2>13. Compliance with Ugandan Regulations</h2>
          <p>
            MediCoreSystem is developed and operated in compliance with Uganda's National ICT Policy 2022, promoting digital transformation, cybersecurity, inclusivity, and fair competition in the healthcare sector.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TermsOfService;