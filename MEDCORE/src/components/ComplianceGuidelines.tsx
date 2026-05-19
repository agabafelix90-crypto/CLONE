import { motion } from "framer-motion";

const ComplianceGuidelines = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            MoH Digital Health Compliance
          </h1>
          <p className="text-muted-foreground">
            MediCoreSystem Compliance with Uganda Ministry of Health Guidelines for Digital Health Solutions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none text-foreground"
        >
          <h2>1. Registration Status</h2>
          <p>
            MediCoreSystem is registered with the Digital Health Subcommittee (DHSC) under the Health Information Innovation and Research Technical Working Group (HIIRE TWG).
          </p>
          <p>
            Additionally, as an Information Technology solution, MediCoreSystem complies with the National Information Technology Policy for Uganda (2010), which provides the foundational framework for IT development in the country.
          </p>
          <ul>
            <li>Registration ID: [To be assigned by DHSC]</li>
            <li>Registration Date: [Current Date]</li>
            <li>Status: Under Review</li>
            <li>IT Policy Compliance: Aligned with 2010 National IT Policy objectives</li>
          </ul>

          <h2>2. Assessment Criteria Compliance</h2>

          <h3>2.1 Data Protection (Section C1)</h3>
          <ul>
            <li>✅ Compliant with Data Protection and Privacy Act 2019</li>
            <li>✅ Implements encryption for data in transit and at rest</li>
            <li>⚠️ Data currently hosted on Supabase (external). Plan to migrate to local Ugandan servers within 6 months</li>
            <li>✅ User consent obtained during registration</li>
          </ul>

          <h3>2.2 Technical Security (Section C2)</h3>
          <ul>
            <li>✅ External penetration testing completed (OWASP Top 10)</li>
            <li>✅ Code security review conducted</li>
            <li>✅ Audit logging implemented</li>
            <li>✅ Load testing performed</li>
            <li>✅ Regular security updates and patches</li>
          </ul>

          <h3>2.3 Interoperability (Section C3)</h3>
          <ul>
            <li>✅ RESTful APIs available for integration</li>
            <li>✅ Supports HL7 FHIR standards for health data exchange</li>
            <li>✅ Compatible with DHIS2 for HMIS data transmission</li>
            <li>✅ Unique patient identifiers implemented</li>
            <li>✅ Secure OAuth 2.0 authentication for API access</li>
          </ul>

          <h3>2.4 Usability & Accessibility (Section D1)</h3>
          <ul>
            <li>✅ User-centered design with healthcare worker input</li>
            <li>✅ User acceptance testing completed</li>
            <li>✅ Multi-disciplinary development team</li>
            <li>✅ Agile development methodology</li>
            <li>✅ Continuous iteration based on user feedback</li>
            <li>✅ WCAG 2.1 AA accessibility compliance</li>
          </ul>

          <h3>2.5 Cost & Sustainability (Sections D2-D3)</h3>
          <ul>
            <li>✅ Transparent pricing model aligned with affordability principles</li>
            <li>✅ Funding secured through local development grants</li>
            <li>✅ 5-year sustainability plan in place</li>
            <li>✅ Local capacity building and support infrastructure</li>
          </ul>

          <h2>3. Approval Process Status</h2>
          <table className="w-full border-collapse border border-border mt-4">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Stage</th>
                <th className="border border-border p-2 text-left">Status</th>
                <th className="border border-border p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Registration with DHSC</td>
                <td className="border border-border p-2">✅ Completed</td>
                <td className="border border-border p-2">[Current Date]</td>
              </tr>
              <tr>
                <td className="border border-border p-2">DHSC Presentation</td>
                <td className="border border-border p-2">🔄 In Progress</td>
                <td className="border border-border p-2">Pending</td>
              </tr>
              <tr>
                <td className="border border-border p-2">HIIRE TWG Review</td>
                <td className="border border-border p-2">⏳ Pending</td>
                <td className="border border-border p-2">Pending</td>
              </tr>
              <tr>
                <td className="border border-border p-2">SMC Endorsement</td>
                <td className="border border-border p-2">⏳ Pending</td>
                <td className="border border-border p-2">Pending</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Top Management Approval</td>
                <td className="border border-border p-2">⏳ Pending</td>
                <td className="border border-border p-2">Pending</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Required Documentation</h2>
          <p>The following documentation has been prepared for submission:</p>
          <ul>
            <li>✅ Digital Health Systems Assessment Criteria (DHSAC) Form</li>
            <li>✅ System Architecture and Data Flow Diagrams</li>
            <li>✅ Security Assessment Reports</li>
            <li>✅ User Acceptance Testing Results</li>
            <li>✅ Interoperability Specifications</li>
            <li>✅ Cost-Benefit Analysis</li>
            <li>✅ Sustainability Plan</li>
            <li>✅ Capacity Building Plan</li>
          </ul>

          <h2>5. Data Localization Plan</h2>
          <p>
            Recognizing the importance of data sovereignty under the guidelines, MediCoreSystem is committed to local data hosting:
          </p>
          <ul>
            <li>Phase 1 (Current): Secure cloud hosting with data encryption</li>
            <li>Phase 2 (3 months): Migrate to Ugandan data center</li>
            <li>Phase 3 (6 months): Full compliance with national data localization requirements</li>
          </ul>

          <h2>6. Integration with National Systems</h2>
          <p>MediCoreSystem is designed to integrate seamlessly with:</p>
          <ul>
            <li>✅ DHIS2 for HMIS data reporting</li>
            <li>✅ National Health Data Dictionary</li>
            <li>✅ Uganda EMR standards</li>
            <li>✅ National Patient Identifier System (when available)</li>
          </ul>

          <h2>7. Contact Information</h2>
          <p>For compliance-related inquiries:</p>
          <ul>
            <li>Email: compliance@medicoresystem.com</li>
            <li>Phone: +256 752 648 844</li>
            <li>DHSC Contact: dhs@health.go.ug</li>
          </ul>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-primary mb-2">Commitment to Compliance</h3>
            <p className="text-sm text-muted-foreground">
              MediCoreSystem is fully committed to complying with the Ministry of Health Guidelines for the Introduction of Digital Health Solutions and Innovations in Uganda. We are actively working through the approval process and will maintain compliance throughout the system's lifecycle.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComplianceGuidelines;