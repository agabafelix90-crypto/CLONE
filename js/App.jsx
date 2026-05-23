import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import LandingPage from './LandingPage';
import LandingPagePhones from './LandingPagePhones'; // Import the mobile version
import Dashboard from './dashboard';
import PermissionGuard from './PermissionGuard';
import Sales from './Sales';
import Store from './Store';
import Selldrugs from './selldrugs';
import GetDrugs from './GetDrugs';
import Contacts from './Contacts';
import AdminDashboard from './AdminDashboard';
import Salesdetails from './Salesdetails';
import Patientappointments from './Patientappointments';
import Statistics from './Statistics';
import Credits from './Credits';
import BirthdayPage from './BirthdayPage';
import DispensedSoldDrugs from './DispensedSoldDrugs';
import TakenFromShelf from './TakenFromShelf';
import DoctorsRoom from './DoctorsRoom';
import DoctorsDashboard from './DoctorsDashboard';
import Cashier from './Cashier';
import AwaitingPayments from './AwaitingPayments';
import LabDashboard2 from './LabDashboard2';
import LabDashboard from './LabDashboard';
import Laboratory from './Laboratory';
import PatientFiles from './PatientFiles';
import PatientFiles2 from './PatientFiles2';
import RadiographerDashboard from './RadiographerDashboard';
import Radiology from './Radiology';
import ViewFile from './ViewFile';
import DischargeForm from './DischargeForm';
import ReferralForm from './ReferralForm';
import DrugOrigins from './DrugOrigins';
import GenerateDrugOrder from './GenerateDrugOrder';
import NurseDashboard from './NurseDashboard';
import Investigations from './Investigations';
import Viewfiles from './Viewfiles';
import ClinicRegistration1 from './ClinicRegistration1';
import ClinicRegistration from './ClinicRegistration';
import Login from './Login';
import Performance from './Performance';
import Malariagraph from './Malariagraph';
import AboutUs from './AboutUs';
import AboutusPhones from './AboutusPhones';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import ComplianceGuidelines from './ComplianceGuidelines';
import SetSurvey from './SetSurvey';
import Triage from './Triage';
import MaternityDashboard from './MaternityDashboard';
import Mothers from './Mothers';
import FamilyPlanningMethods from './FamilyPlanningMethods'; 
import SuggestionBox from './SuggestionBox'; 
import SubmitSuggestion from './SubmitSuggestion'; 
import CreatQRcode from './CreatQRcode'; 
import CreateReceipt from './CreateReceipt'; 
import Feedback from './Feedback'; 
import EmployeeSettings from './EmployeeSettings';
import RequireOnboardingGuard from './RequireOnboardingGuard';
import Onboarding from './Onboarding';
import Pricing from './Pricing';
import PricingPhones from './PricingPhones';
import ResetLifeWalletPassword from './ResetLifeWalletPassword';
import Invoice from './Invoice';
import ManageServices from './ManageServices';
import ManageCategories from './ManageCategories';
import VideoCallPage from './VideoCallPage';
import PaymentNew from './PaymentNew';
import EmployeeBalance from './EmployeeBalance';
import InsertClinics from './InsertClinics';
import StockTracking from './StockTracking';

// Device detection function
const isMobileDevice = () => {
  return (
    (window.innerWidth <= 768) || 
    (navigator.userAgent.match(/Android/i)) ||
    (navigator.userAgent.match(/webOS/i)) ||
    (navigator.userAgent.match(/iPhone/i)) ||
    (navigator.userAgent.match(/iPad/i)) ||
    (navigator.userAgent.match(/iPod/i)) ||
    (navigator.userAgent.match(/BlackBerry/i)) ||
    (navigator.userAgent.match(/Windows Phone/i))
  );
};

// Component to choose the appropriate landing page
const DynamicLandingPage = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    // Check on initial load
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <LandingPagePhones /> : <LandingPage />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Use DynamicLandingPage for the root path */}
        <Route path="/" element={<DynamicLandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/clinic-registration1" element={<ClinicRegistration1 />} />
        <Route path="/clinic-registration" element={<ClinicRegistration />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/aboutusphones" element={<AboutusPhones />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/pricingphones" element={<PricingPhones />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/compliance" element={<ComplianceGuidelines />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<RequireOnboardingGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Permission-protected routes */}
          <Route element={<PermissionGuard />}>
            <Route path="/sales" element={<Cashier />} />
            <Route path="/store" element={<Store />} />
            <Route path="/selldrugs" element={<Selldrugs />} />
            <Route path="/dispensary/shelves" element={<Selldrugs />} />
            <Route path="/cashier" element={<Cashier />} />
            <Route path="/manageDrugs" element={<DrugOrigins />} />
            <Route path="/makeOrderForDrugs" element={<GenerateDrugOrder />} />
            <Route path="/access-laboratory" element={<LabDashboard2 />} />
            <Route path="/labTests" element={<LabDashboard />} />
            <Route path="/lab" element={<Laboratory />} />
            <Route path="/access-doctors-room" element={<DoctorsDashboard />} />
            <Route path="/attend-to-new-patient" element={<DoctorsRoom />} />
            <Route path="/access-nurse" element={<NurseDashboard />} />
            <Route path="/access-radiographer" element={<RadiographerDashboard />} />
            <Route path="/radiology" element={<Radiology />} />
            <Route path="/manageServices" element={<ManageServices />} />
            <Route path="/set-sales-expenses-categories" element={<ManageCategories />} />
            <Route path="/clinicStatistics" element={<Statistics />} />
            <Route path="/access-sales-details" element={<Salesdetails />} />
            <Route path="/triage" element={<Triage />} />
            <Route path="/familyPlanning" element={<FamilyPlanningMethods />} />
            <Route path="/maternity-dashboard" element={<MaternityDashboard />} />
            <Route path="/manageLaboratory" element={<Investigations />} />
            <Route path="/credits" element={<Credits />} />
          </Route>

          {/* Non-permission-protected routes (keep direct access) */}
          <Route path="/salespage" element={<Sales />} />
          <Route path="/invoices" element={<Invoice />} />
          <Route path="/remove-drugs" element={<GetDrugs />} />
          <Route path="/contacts/:employee" element={<Contacts />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/settings" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/employeesettings" element={<EmployeeSettings />} />
          <Route path="/employee-settings" element={<EmployeeSettings />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/birthdays/:employee" element={<BirthdayPage />} />
          <Route path="/patient-appointments" element={<Patientappointments />} />
          <Route path="/awaitingpayments" element={<AwaitingPayments />} />
          <Route path="/patientfiles" element={<PatientFiles />} />
          <Route path="/patientfiles2" element={<PatientFiles2 />} />
          <Route path="/patient-file/:token/:fileId" element={<ViewFile />} />
          <Route path="/patient-file2/:token/:fileId" element={<Viewfiles />} />
          <Route path="/discharge-form/:token/:fileId" element={<DischargeForm />} />
          <Route path="/referral-form/:token/:fileId" element={<ReferralForm />} />
          <Route path="/clinic-registration" element={<ClinicRegistration />} />
          <Route path="/employeePerformance" element={<Performance />} />
          <Route path="/malariaBarGraph" element={<Malariagraph />} />
          <Route path="/makePayment" element={<PaymentNew />} />
          <Route path="/suggestion-box/:token" element={<SuggestionBox />} />
          <Route path="/suggestionbox/:token" element={<CreatQRcode />} />
          <Route path="/rct" element={<CreateReceipt />} />
          <Route path="/mothers" element={<Mothers />} />
          <Route path="/submitsuggestion/:clinicName" element={<SubmitSuggestion />} />
          <Route path="/submitsuggestion/:clinicName/:token" element={<Feedback />} />
          <Route path="/forgotlifewalletpassword/:token" element={<ResetLifeWalletPassword />} />
          <Route path="/videocall/:token" element={<VideoCallPage />} />
          <Route path="/employeebalance" element={<EmployeeBalance />} />
          <Route path="/insert-clinics" element={<InsertClinics />} />
          <Route path="/stocktracking" element={<StockTracking />} />
          <Route path="/dispensed-and-sold" element={<DispensedSoldDrugs />} />
          <Route path="/removed-drugs-equipment" element={<TakenFromShelf />} />
          <Route path="/setsurvey" element={<SetSurvey />} />
          <Route path="/birthdays" element={<BirthdayPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  </Router>
  );
}

export default App;