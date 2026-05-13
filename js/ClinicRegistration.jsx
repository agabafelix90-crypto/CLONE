import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { urls } from './config.dev';
import { saveSessionToken } from './authUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash,
  faSpinner,
  faCheckCircle,
  faMobileAlt,
  faMoneyBillWave,
  faBriefcase,
  faUserMd,
  faHospital,
  faGem,
  faTrophy,
  faClock,
  faSyncAlt,
  faUsers,
  faHandHoldingUsd,
  faShareAlt,
  faGift,
  faArrowRight,
  faUserPlus,
  faClinicMedical,
  faLock,
  faMapMarkerAlt,
  faCalendarAlt,
  faUsers as faUsersIcon,
  faUserTag,
  faHome,
  faPhoneAlt,
  faEnvelope,
 
} from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';

function ClinicRegistration() {
  const [formData, setFormData] = useState({
    clinicName: '',
    email: '',
    district: '',
    county: '',
    subCounty: '',
    town: '',
    yearOfOpening: '',
    numberOfEmployees: '',
    ownersNames: '',
    ownersAddress: '',
    ownersContact: '',
    ownersWhatsapp: '',
    referrer: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [showEmployeeSetupPrompt, setShowEmployeeSetupPrompt] = useState(false);
  const [setupToken, setSetupToken] = useState(null);
  const navigate = useNavigate();

  // Color scheme
  const primaryColor = '#007CF0';
  const mediJobsColor = '#8B5CF6';
  const rewardsColor = '#F59E0B';
  const referralColor = '#10B981';

  // Rotate panels every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPanel(prev => (prev === 2 ? 0 : prev + 1));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const checkEmployeeSetup = async (token) => {
    try {
      const response = await fetch(`${urls.fetchemployees2}?token=${token}`);
      if (response.ok) {
        const employees = await response.json();
        const employeeList = Array.isArray(employees) ? employees : (employees.employees || []);
        if (employeeList.length === 0) {
          setSetupToken(token);
          setShowEmployeeSetupPrompt(true);
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking employees:', error);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const requiredFields = [
      'clinicName',
      'email',
      'district',
      'county',
      'town',
      'yearOfOpening',
      'numberOfEmployees',
      'ownersNames',
      'ownersAddress',
      'ownersContact',
      'ownersWhatsapp',
      'password',
      'confirmPassword'
    ];
  
    for (const field of requiredFields) {
      if (formData[field].trim() === '') {
        toast.error('Please fill in all required fields.', { position: 'top-left' });
        return;
      }
    }
  
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!', { position: 'top-left' });
      return;
    }
  
    // Send plain password (no encryption) - match both camelCase and snake_case backend fields
    const payload = {
      ...formData,
      name: formData.clinicName,
      clinic_name: formData.clinicName,
      confirm_password: formData.confirmPassword,
      owners_names: formData.ownersNames,
      owners_address: formData.ownersAddress,
      owners_contact: formData.ownersContact,
      owners_whatsapp: formData.ownersWhatsapp,
      number_of_employees: formData.numberOfEmployees,
      year_of_opening: formData.yearOfOpening,
    };

    setLoading(true);
    try {
      const response = await fetch(urls.registerClinic, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const responseData = await response.json();

        if (!responseData.success) {
          const message = responseData.message || 'Registration failed!';
          if (message === 'Clinic name already exists.') {
            toast.error('Clinic Name is already taken, please choose another Clinic name.', { position: 'top-left' });
          } else {
            toast.error(message, { position: 'top-left' });
          }
          return;
        }

        const sessionToken = responseData.sessionToken || responseData.clinic_session_token || responseData.clinic?.id;

        if (sessionToken) {
          saveSessionToken(sessionToken);
          toast.success('Registration successful! Redirecting to onboarding...', { position: 'top-left' });
          setTimeout(() => {
            navigate(`/onboarding?token=${sessionToken}`);
          }, 800);
        } else {
          toast.success('Registration successful! Please log in to continue.', { position: 'top-left' });
          setTimeout(() => {
            navigate('/login');
          }, 5000);
        }
      } else {
        const responseData = await response.json();
        if (responseData.error === 'Clinic name already exists.') {
          toast.error('Clinic Name is already taken, please choose another Clinic name.', { position: 'top-left' });
        } else {
          toast.error('Registration failed!', { position: 'top-left' });
        }
      }
    } catch (error) {
      toast.error('Registration failed!', { position: 'top-left' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: 'stretch',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden',
    }}>
      <ToastContainer />

      {/* Left Panel - Registration Form */}
      <div style={{
        flex: '1',
        minHeight: { xs: 'auto', md: '100vh' },
        maxHeight: { xs: 'auto', md: '100vh' },
        padding: { xs: '30px 20px', md: '40px' },
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        minWidth: '350px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #007CF0 0%, #0068FF 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FontAwesomeIcon icon={faUserPlus} size="lg" style={{ color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: { xs: '24px', md: '28px' },
            fontWeight: '700',
            margin: '0 0 8px',
            letterSpacing: '-0.5px',
            color: '#2d3748',
          }}>Create Clinic Account</h1>
          <p style={{
            fontSize: { xs: '14px', md: '15px' },
            fontWeight: '400',
            margin: '0',
            color: '#6c757d',
          }}>Register your clinic for comprehensive management</p>
        </div>

        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '24px',
          maxWidth: '500px',
          width: '100%',
          margin: '0 auto 24px',
          color: '#334155'
        }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: '#0F172A' }}>Setup after registration</h2>
          <p style={{ margin: '0 0 10px', lineHeight: '1.6' }}>
            After you create your clinic account, sign in and go to the Admin Dashboard to configure the clinic. Then use Employee Settings to add staff, assign permissions, and complete setup.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#007CF0',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Go to Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin-dashboard')}
              style={{
                backgroundColor: 'transparent',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Admin Dashboard Info
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faClinicMedical} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Clinic Name
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  required
                  placeholder="Enter clinic name"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  placeholder="Enter district"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Country
                </label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  required
                  placeholder="Enter country"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Town
                </label>
                <input
                  type="text"
                  name="town"
                  value={formData.town}
                  onChange={handleChange}
                  required
                  placeholder="Enter town"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Year of Opening
                </label>
                <input
                  type="number"
                  name="yearOfOpening"
                  value={formData.yearOfOpening}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 2020"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faUsersIcon} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Number of Employees
                </label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 10"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '6px',
                letterSpacing: '0.2px',
              }}>
                <FontAwesomeIcon icon={faUserTag} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                Owners' Names
              </label>
              <input
                type="text"
                name="ownersNames"
                value={formData.ownersNames}
                onChange={handleChange}
                required
                placeholder="Enter owners' names"
                style={{
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1.5px solid #dee2e6',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  backgroundColor: '#ffffff',
                  color: '#212529',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '6px',
                letterSpacing: '0.2px',
              }}>
                <FontAwesomeIcon icon={faHome} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                Owners' Address
              </label>
              <input
                type="text"
                name="ownersAddress"
                value={formData.ownersAddress}
                onChange={handleChange}
                required
                placeholder="Enter owners' address"
                style={{
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1.5px solid #dee2e6',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  backgroundColor: '#ffffff',
                  color: '#212529',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="ownersContact"
                  value={formData.ownersContact}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="e.g., 0777123456"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '6px', color: '#25D366', fontSize: '12px' }} /> 
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="ownersWhatsapp"
                  value={formData.ownersWhatsapp}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="e.g., 0777123456"
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1.5px solid #dee2e6',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    color: '#212529',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Admin Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Create admin password"
                    style={{
                      padding: '10px 35px 10px 12px',
                      fontSize: '13px',
                      border: '1.5px solid #dee2e6',
                      borderRadius: '6px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      color: '#212529',
                      width: '100%',
                    }}
                  />
                  <FontAwesomeIcon
                    icon={passwordVisible ? faEyeSlash : faEye}
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      cursor: 'pointer',
                      color: '#6c757d',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '6px',
                  letterSpacing: '0.2px',
                }}>
                  <FontAwesomeIcon icon={faLock} style={{ marginRight: '6px', color: primaryColor, fontSize: '12px' }} /> 
                  Confirm Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    style={{
                      padding: '10px 35px 10px 12px',
                      fontSize: '13px',
                      border: '1.5px solid #dee2e6',
                      borderRadius: '6px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      color: '#212529',
                      width: '100%',
                    }}
                  />
                  <FontAwesomeIcon
                    icon={confirmPasswordVisible ? faEyeSlash : faEye}
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      cursor: 'pointer',
                      color: '#6c757d',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: '1',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #007CF0 0%, #0068FF 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                    Registering...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '8px' }} />
                    Register Clinic
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  flex: '1',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057',
                  background: '#ffffff',
                  border: '1.5px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Back to Login
              </button>
            </div>
          </form>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '25px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#495057', fontWeight: '500' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: primaryColor, fontSize: '12px' }} />
              <span>Secure & Encrypted Registration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#495057', fontWeight: '500' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: primaryColor, fontSize: '12px' }} />
              <span>Your data is protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Promotional Content */}
      <div style={{
        flex: '1.2',
        minHeight: { xs: 'calc(100vh - 500px)', md: '100vh' },
        background: '#0A2540',
        padding: { xs: '20px', md: '40px' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '350px',
      }}>
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
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

        {/* Panel Indicators */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              onClick={() => setCurrentPanel(index)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentPanel === index ? 
                  index === 0 ? mediJobsColor : 
                  index === 1 ? rewardsColor : referralColor 
                  : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Timer Indicator */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <FontAwesomeIcon icon={faSyncAlt} spin />
          <span>Auto-switching</span>
        </div>

        {/* Panel Content Container */}
        <div style={{
          width: '100%',
          maxWidth: '600px',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: { xs: '0 10px', md: '0 20px' },
        }}>
          
          {/* MediJobs Panel */}
          {currentPanel === 0 && (
            <div style={{
              animation: 'slideIn 0.5s ease-out',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${mediJobsColor}, #6D28D9)`,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 25px',
                animation: 'float 4s ease-in-out infinite',
              }}>
                <FontAwesomeIcon icon={faBriefcase} size="2x" style={{ color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: { xs: '28px', md: '36px' },
                fontWeight: '800',
                margin: '0 0 15px',
                background: `linear-gradient(90deg, ${mediJobsColor}, #6D28D9)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                MediJobs
              </h2>

              <p style={{
                fontSize: { xs: '18px', md: '22px' },
                fontWeight: '600',
                margin: '0 0 10px',
                color: 'white',
              }}>
                Medical Job Platform
              </p>

              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',

              }}>
                Connecting healthcare professionals with job opportunities. 
                Coming soon on Android.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '15px',
                marginBottom: '25px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <FontAwesomeIcon icon={faUserMd} style={{ 
                    fontSize: '20px', 
                    color: mediJobsColor,
                    marginBottom: '10px',
                  }} />
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '5px' }}>
                    For Professionals
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, color: 'white' }}>
                    Find medical jobs
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <FontAwesomeIcon icon={faHospital} style={{ 
                    fontSize: '20px', 
                    color: '#3B82F6',
                    marginBottom: '10px',
                  }} />
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '5px' }}>
                    For Employers
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, color: 'white' }}>
                    Hire medical staff
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-block',
                background: `linear-gradient(90deg, ${mediJobsColor}, #6D28D9)`,
                padding: '10px 25px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.5px',
              }}>
                COMING SOON
              </div>
            </div>
          )}

          {/* Cash Rewards Panel */}
          {currentPanel === 1 && (
            <div style={{
              animation: 'slideIn 0.5s ease-out',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${rewardsColor}, #DC2626)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 25px',
                animation: 'float 4s ease-in-out infinite',
              }}>
                <FontAwesomeIcon icon={faTrophy} size="2x" style={{ color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: { xs: '28px', md: '36px' },
                fontWeight: '800',
                margin: '0 0 15px',
                background: `linear-gradient(90deg, ${rewardsColor}, #DC2626)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Daily Rewards
              </h2>

              <p style={{
                fontSize: { xs: '18px', md: '22px' },
                fontWeight: '600',
                margin: '0 0 10px',
                color: 'white',
              }}>
                Earn Cash Daily
              </p>

              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'rgba(255,255,255,0.85)',
                maxWidth: '500px',
                margin: '0 auto 30px',
              }}>
                Top performers win daily cash prizes. Withdraw instantly via mobile money.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '25px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '5px' }}>
                    1st
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, color: 'white' }}>
                    Daily Winner
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                }}>
                  <FontAwesomeIcon icon={faMobileAlt} style={{ 
                    fontSize: '18px', 
                    color: '#10B981',
                    marginBottom: '5px',
                  }} />
                  <div style={{ fontSize: '10px', opacity: 0.8, color: 'white' }}>
                    Mobile Money
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                }}>
                  <FontAwesomeIcon icon={faClock} style={{ 
                    fontSize: '18px', 
                    color: '#3B82F6',
                    marginBottom: '5px',
                  }} />
                  <div style={{ fontSize: '10px', opacity: 0.8, color: 'white' }}>
                    24/7 Tracking
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '15px',
                padding: '15px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '10px' }}>
                  How to Win:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px' }}>Use System</span>
                  <FontAwesomeIcon icon={faArrowRight} size="xs" />
                  <span style={{ fontSize: '12px' }}>Top Performance</span>
                  <FontAwesomeIcon icon={faArrowRight} size="xs" />
                  <span style={{ fontSize: '12px' }}>Get Paid</span>
                </div>
              </div>
            </div>
          )}

          {/* Referral Commissions Panel */}
          {currentPanel === 2 && (
            <div style={{
              animation: 'slideIn 0.5s ease-out',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${referralColor}, #059669)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 25px',
                animation: 'float 4s ease-in-out infinite',
              }}>
                <FontAwesomeIcon icon={faHandHoldingUsd} size="2x" style={{ color: 'white' }} />
              </div>

              <h2 style={{
                fontSize: { xs: '28px', md: '36px' },
                fontWeight: '800',
                margin: '0 0 15px',
                background: `linear-gradient(90deg, ${referralColor}, #059669)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Refer & Earn
              </h2>

              <p style={{
                fontSize: { xs: '18px', md: '22px' },
                fontWeight: '600',
                margin: '0 0 10px',
                color: 'white',
              }}>
                High Commission Referrals
              </p>

              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'rgba(255,255,255,0.85)',
                maxWidth: '500px',
                margin: '0 auto 30px',
              }}>
                Refer clinics and earn substantial commissions. Unlimited earning potential.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '15px',
                marginBottom: '25px',
                maxWidth: '300px',
                margin: '0 auto 25px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: `2px solid ${referralColor}40`,
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '5px',
                    textShadow: '0 2px 10px rgba(16, 185, 129, 0.5)',
                  }}>
                    UGX 300K
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                    Per Local Installation
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '5px',
                  }}>
                    UGX 150K
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, color: 'white' }}>
                    Per Online Signup
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-block',
                background: `linear-gradient(90deg, ${referralColor}, #059669)`,
                padding: '10px 25px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.5px',
              }}>
                START EARNING
              </div>
            </div>
          )}

          {/* Panel Counter */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Panel {currentPanel + 1} of 3
          </div>
        </div>

        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: currentPanel === 0 ? `radial-gradient(circle at 80% 20%, ${mediJobsColor}20 0%, transparent 50%)` :
                    currentPanel === 1 ? `radial-gradient(circle at 20% 80%, ${rewardsColor}20 0%, transparent 50%)` :
                    `radial-gradient(circle at 50% 50%, ${referralColor}20 0%, transparent 50%)`,
          zIndex: 1,
        }} />
      </div>

      {/* Employee Setup Modal */}
      {showEmployeeSetupPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px 30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              background: 'linear-gradient(135deg, #007CF0 0%, #0068FF 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <FontAwesomeIcon icon={faUsers} size="2x" style={{ color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 12px',
              color: '#0F172A',
            }}>
              Complete Your Setup
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#64748B',
              margin: '0 0 30px',
              lineHeight: '1.6',
            }}>
              Your clinic is created! The next step is to add your staff members and configure their permissions in Employee Settings.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexDirection: 'column',
            }}>
              <button
                onClick={() => {
                  setShowEmployeeSetupPrompt(false);
                  navigate(`/employee-settings?token=${setupToken}`);
                }}
                style={{
                  background: 'linear-gradient(135deg, #007CF0 0%, #0068FF 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => {
                  e.target.style.boxShadow = '0 10px 30px rgba(0, 124, 240, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <FontAwesomeIcon icon={faArrowRight} size="sm" />
                Go to Employee Settings
              </button>
              <button
                onClick={() => {
                  setShowEmployeeSetupPrompt(false);
                  navigate(`/dashboard?token=${setupToken}`);
                }}
                style={{
                  background: 'transparent',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#F1F5F9';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
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

export default ClinicRegistration;