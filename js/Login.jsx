import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { urls } from "./config.dev";
import { saveSessionToken, clearSessionToken, getRedirectAfterLogin, clearRedirectAfterLogin } from './authUtils';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClinicMedical,
  faLock,
  faSignInAlt,
  faUserPlus,
  faEye,
  faEyeSlash,
  faSpinner,
  faCheckCircle,
  faBriefcase,
  faUserMd,
  faHospital,
  faTrophy,
  faMobileAlt,
  faClock,
  faSyncAlt,
  faUsers,
  faHandHoldingUsd,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    clinicName: "",
    password: "",
    showPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);

  const [showEmployeeSetupPrompt, setShowEmployeeSetupPrompt] = useState(false);
  const [currentSessionToken, setCurrentSessionToken] = useState(null);

  // --- COLORS ---
  const primaryColor = "#007CF0";
  const mediJobsColor = "#8B5CF6";
  const rewardsColor = "#F59E0B";
  const referralColor = "#10B981";

  // --- CLIENT-SIDE LOGIN RATE LIMITING ---
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 30;

  const attemptKey = useMemo(() => "MEDCORE_login_attempts", []);
  const lockKey = useMemo(() => "MEDCORE_login_lock_until", []);

  const isLockedOut = () => {
    const lockUntil = Number(localStorage.getItem(lockKey));
    if (!lockUntil) return false;
    return Date.now() < lockUntil;
  };

  const getRemainingLockTime = () => {
    const lockUntil = Number(localStorage.getItem(lockKey));
    if (!lockUntil) return 0;
    return Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
  };

  const registerFailedAttempt = () => {
    const attempts = Number(localStorage.getItem(attemptKey) || "0") + 1;
    localStorage.setItem(attemptKey, String(attempts));

    if (attempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_SECONDS * 1000;
      localStorage.setItem(lockKey, String(lockUntil));
      localStorage.setItem(attemptKey, "0");
      return true;
    }
    return false;
  };

  const resetAttempts = () => {
    localStorage.setItem(attemptKey, "0");
    localStorage.removeItem(lockKey);
  };

  // Rotate panels every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPanel((prev) => (prev === 2 ? 0 : prev + 1));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // basic input hardening
    if (name === "clinicName" && value.length > 60) return;
    if (name === "password" && value.length > 100) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setFormData((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const saveSession = (sessionToken) => {
    // Store token securely and keep compatibility with legacy pages
    saveSessionToken(sessionToken);
  };

  const checkEmployeeSetup = async (token) => {
    try {
      const response = await fetch(`${urls.fetchemployees2}?token=${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      const employeeList = Array.isArray(data) ? data : data?.employees || [];

      if (employeeList.length === 0) {
        setShowEmployeeSetupPrompt(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Employee check error:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (isLockedOut()) {
      toast.error(
        `Too many attempts. Try again in ${getRemainingLockTime()} seconds.`,
        { position: "top-left" }
      );
      return;
    }

    const clinicName = formData.clinicName.trim();
    const password = formData.password;

    if (!clinicName || !password) {
      toast.error("Please fill in all fields.", { position: "top-left" });
      return;
    }

    if (clinicName.length < 2) {
      toast.error("Clinic name is too short.", { position: "top-left" });
      return;
    }

    if (password.length < 4) {
      toast.error("Password is too short.", { position: "top-left" });
      return;
    }

    setLoading(true);
    clearSessionToken();

    try {
      const response = await fetch(urls.loginClinic, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName,
          name: clinicName,
          clinic_name: clinicName,
          email: clinicName,
          password,
        }),
      });

      let responseData = null;

      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok || !responseData?.success) {
        const locked = registerFailedAttempt();
        const errorMessage =
          responseData?.message || responseData?.error || 'Login failed. Check your credentials.';
        if (locked) {
          toast.error(
            `Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`,
            { position: "top-left" }
          );
        } else {
          toast.error(errorMessage, {
            position: "top-left",
          });
        }
        return;
      }

      // extract token safely
      const sessionToken =
        responseData.sessionToken ||
        responseData.clinic_session_token ||
        responseData?.clinic?.clinic_session_token ||
        responseData?.clinic?.id ||
        responseData?.clinic?.clinic_id;

      if (!sessionToken) {
        toast.error("Login failed: missing session token.", {
          position: "top-left",
        });
        return;
      }

      resetAttempts();
      saveSession(sessionToken);
      setCurrentSessionToken(sessionToken);

      toast.success("Login successful!", { position: "top-left" });

      const redirectPath = getRedirectAfterLogin();
      clearRedirectAfterLogin();

      if (redirectPath && redirectPath !== '/login') {
        try {
          // Request a short-lived redirect token from the backend to avoid exposing/storing expired tokens
          const resp = await fetch(urls.dashboardtoken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: sessionToken, createRedirect: true }),
          });
          let respData = null;
          try { respData = await resp.json(); } catch {};

          const redirectToken = respData && respData.success && respData.token ? respData.token : sessionToken;

          const fullRedirectUrl = new URL(redirectPath, window.location.origin);
          fullRedirectUrl.searchParams.set('token', redirectToken);
          navigate(`${fullRedirectUrl.pathname}${fullRedirectUrl.search}${fullRedirectUrl.hash}`, { replace: true });
          return;
        } catch (error) {
          console.error('Invalid redirect path, falling back to dashboard:', error);
        }
      }

      if (responseData.isFirstLogin) {
        navigate(`/onboarding?token=${sessionToken}`);
      } else {
        navigate(`/dashboard?token=${sessionToken}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please try again.", { position: "top-left" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "stretch",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      <ToastContainer />

      {/* Left Panel - Login */}
      <div
        style={{
          flex: "1",
          padding: "40px",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          minWidth: "350px",
          zIndex: 2,
        }}
      >
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #007CF0 0%, #0068FF 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FontAwesomeIcon
              icon={faSignInAlt}
              size="lg"
              style={{ color: "white" }}
            />
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px",
              color: "#2d3748",
            }}
          >
            Welcome Back
          </h1>

          <p style={{ fontSize: "15px", margin: "0", color: "#6c757d" }}>
            Sign in to your MEDCORE account
          </p>
        </div>

        <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%" }}>
          <form onSubmit={handleSubmit}>
            {/* Clinic Name or Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#2d3748",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                <FontAwesomeIcon
                  icon={faClinicMedical}
                  style={{ marginRight: "8px", color: primaryColor }}
                />
                Clinic Name or Email</label>
              <input
                type="text"
                name="clinicName"
                placeholder="Enter clinic name or email"
                autoComplete="username"
                value={formData.clinicName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = primaryColor)
                }
                onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              />
              <p style={{
                fontSize: "12px",
                color: "#6c757d",
                marginTop: "4px",
                marginBottom: "0"
              }}>
                Use your clinic name or registered email address.
                If your clinic name is shared by another facility, please login with your registered email.
              </p>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#2d3748",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                <FontAwesomeIcon
                  icon={faLock}
                  style={{ marginRight: "8px", color: primaryColor }}
                />
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  type={formData.showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{
                    padding: "12px 45px 12px 15px",
                    fontSize: "14px",
                    border: "1.5px solid #dee2e6",
                    borderRadius: "8px",
                    width: "100%",
                    outline: "none",
                  }}
                />

                <FontAwesomeIcon
                  icon={formData.showPassword ? faEyeSlash : faEye}
                  onClick={togglePasswordVisibility}
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "16px", marginTop: "30px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: "1",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "white",
                  background:
                    "linear-gradient(135deg, #007CF0 0%, #0068FF 100%)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      style={{ marginRight: "8px" }}
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faSignInAlt}
                      style={{ marginRight: "8px" }}
                    />
                    Log In
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/clinic-registration")}
                style={{
                  flex: "1",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#495057",
                  background: "#ffffff",
                  border: "1.5px solid #dee2e6",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
                Register
              </button>
            </div>
          </form>

          {/* Security Info */}
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                fontSize: "13px",
                color: "#495057",
                marginBottom: "10px",
              }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ color: primaryColor }}
              />
              <span>24/7 System Availability</span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                fontSize: "13px",
                color: "#495057",
              }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ color: primaryColor }}
              />
              <span>Brute-force protection enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          flex: "1.2",
          background: "#0A2540",
          padding: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          minWidth: "350px",
        }}
      >
        <style>
          {`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(30px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}
        </style>

        {/* Indicators */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              onClick={() => setCurrentPanel(index)}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background:
                  currentPanel === index
                    ? index === 0
                      ? mediJobsColor
                      : index === 1
                      ? rewardsColor
                      : referralColor
                    : "rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FontAwesomeIcon icon={faSyncAlt} spin />
          <span>Auto-switching</span>
        </div>

        <div style={{ width: "100%", maxWidth: "600px" }}>
          {/* Panel 0 */}
          {currentPanel === 0 && (
            <div style={{ animation: "slideIn 0.5s ease-out", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: `linear-gradient(135deg, ${mediJobsColor}, #6D28D9)`,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 25px",
                  animation: "float 4s ease-in-out infinite",
                }}
              >
                <FontAwesomeIcon icon={faBriefcase} size="2x" style={{ color: "white" }} />
              </div>

              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "0 0 15px",
                  background: `linear-gradient(90deg, ${mediJobsColor}, #6D28D9)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                MediJobs
              </h2>

              <p style={{ fontSize: "20px", fontWeight: "600", color: "white" }}>
                Medical Job Platform
              </p>

              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                Connecting healthcare professionals with job opportunities. Coming soon.
              </p>
            </div>
          )}

          {/* Panel 1 */}
          {currentPanel === 1 && (
            <div style={{ animation: "slideIn 0.5s ease-out", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: `linear-gradient(135deg, ${rewardsColor}, #DC2626)`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 25px",
                  animation: "float 4s ease-in-out infinite",
                }}
              >
                <FontAwesomeIcon icon={faTrophy} size="2x" style={{ color: "white" }} />
              </div>

              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "0 0 15px",
                  background: `linear-gradient(90deg, ${rewardsColor}, #DC2626)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Daily Rewards
              </h2>

              <p style={{ fontSize: "20px", fontWeight: "600", color: "white" }}>
                Earn Cash Daily
              </p>

              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                Top performers win daily prizes. Withdraw instantly via mobile money.
              </p>
            </div>
          )}

          {/* Panel 2 */}
          {currentPanel === 2 && (
            <div style={{ animation: "slideIn 0.5s ease-out", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: `linear-gradient(135deg, ${referralColor}, #059669)`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 25px",
                  animation: "float 4s ease-in-out infinite",
                }}
              >
                <FontAwesomeIcon icon={faHandHoldingUsd} size="2x" style={{ color: "white" }} />
              </div>

              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "0 0 15px",
                  background: `linear-gradient(90deg, ${referralColor}, #059669)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Refer & Earn
              </h2>

              <p style={{ fontSize: "20px", fontWeight: "600", color: "white" }}>
                High Commission Referrals
              </p>

              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                Refer clinics and earn commissions. Unlimited earning potential.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Setup Modal */}
      {showEmployeeSetupPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "40px 30px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                background: "linear-gradient(135deg, #007CF0 0%, #0068FF 100%)",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <FontAwesomeIcon icon={faUsers} size="2x" style={{ color: "white" }} />
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A" }}>
              Complete Your Setup
            </h2>

            <p style={{ fontSize: "15px", color: "#64748B", marginTop: "10px" }}>
              Your clinic is created. Please add employees and permissions in Employee Settings.
            </p>

            <div style={{ marginTop: "25px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowEmployeeSetupPrompt(false);
                  navigate(`/employee-settings?token=${currentSessionToken}`);
                }}
                style={{
                  background: "linear-gradient(135deg, #007CF0 0%, #0068FF 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: 8 }} />
                Go to Employee Settings
              </button>

              <button
                onClick={() => {
                  setShowEmployeeSetupPrompt(false);
                  navigate(`/dashboard?token=${currentSessionToken}`);
                }}
                style={{
                  background: "transparent",
                  color: "#0F172A",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
