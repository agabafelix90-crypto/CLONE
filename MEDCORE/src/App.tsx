import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import EmployeeLoginPage from "./pages/EmployeeLoginPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WelcomePage from "./pages/WelcomePage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import SettingsPage from "./pages/SettingsPage";
import TriagePage from "./pages/TriagePage";
import DoctorPage from "./pages/DoctorPage";
import MaternityPage from "./pages/MaternityPage";
import NursePage from "./pages/NursePage";
import PharmacyPage from "./pages/PharmacyPage";
import LaboratoryPage from "./pages/LaboratoryPage";
import RadiologyPage from "./pages/RadiologyPage";
import SetLabExamsPage from "./pages/SetLabExamsPage";
import SetDrugsPage from "./pages/SetDrugsPage";
import StorePage from "./pages/StorePage";
import CommunicationPage from "./pages/CommunicationPage";
import CashierPage from "./pages/CashierPage";
import BillingPage from "./pages/BillingPage";
import StockTrackingPage from "./pages/StockTrackingPage";
import DiseaseStatisticsPage from "./pages/DiseaseStatisticsPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import ComplianceGuidelines from "./components/ComplianceGuidelines";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EmployeeProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/compliance" element={<ComplianceGuidelines />} />
              <Route path="/employee-login" element={<ProtectedRoute><EmployeeLoginPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="cashier" element={<CashierPage />} />
                <Route path="pharmacy" element={<PharmacyPage />} />
                <Route path="radiology" element={<RadiologyPage />} />
                <Route path="store" element={<StorePage />} />
                <Route path="doctor" element={<DoctorPage />} />
                <Route path="laboratory" element={<LaboratoryPage />} />
                <Route path="nurse" element={<NursePage />} />
                <Route path="triage" element={<TriagePage />} />
                <Route path="maternity" element={<MaternityPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="communication" element={<CommunicationPage />} />
                <Route path="stock" element={<StockTrackingPage />} />
                <Route path="statistics" element={<DiseaseStatisticsPage />} />
                <Route path="sales" element={<SalesHistoryPage />} />
                <Route path="set-lab-exams" element={<SetLabExamsPage />} />
                <Route path="set-drugs" element={<SetDrugsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
      </EmployeeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
