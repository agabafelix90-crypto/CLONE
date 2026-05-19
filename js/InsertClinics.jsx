import React, { useState } from 'react';
import { urls } from './config.dev';

const InsertClinics = () => {
  const [formData, setFormData] = useState({
    clinicName: '',
    ownerName: '',
    email: '',
    phone1: '',
    phone2: '',
    phone3: '',
    district: '',
    town: '',
    systemStatus: '', // New field for system status
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // System status options
  const systemOptions = [
    { value: '', label: 'Select system status' },
    { value: 'clinic_pro', label: 'Using MEDCORE' },
    { value: 'no_system', label: 'No System Yet' },
    { value: 'other_system', label: 'Using Another System' },
    { value: 'not_sure', label: 'Not Sure/Unknown' },
    { value: 'interested', label: 'Interested in MEDCORE' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clinicName.trim()) {
      setMessage({ text: 'Clinic name is required', type: 'error' });
      return;
    }
    
    if (!formData.phone1.trim()) {
      setMessage({ text: 'Primary phone number is required', type: 'error' });
      return;
    }
    
    if (!formData.district.trim()) {
      setMessage({ text: 'District is required', type: 'error' });
      return;
    }

    if (!formData.systemStatus) {
      setMessage({ text: 'Please select the clinic system status', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(urls.addclinic, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          text: data.message || 'Clinic added successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setFormData({
          clinicName: '',
          ownerName: '',
          email: '',
          phone1: '',
          phone2: '',
          phone3: '',
          district: '',
          town: '',
          systemStatus: '',
        });
      } else {
        const errorData = await response.json();
        setMessage({ 
          text: errorData.message || 'Failed to add clinic', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Network error. Please try again.', 
        type: 'error' 
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      clinicName: '',
      ownerName: '',
      email: '',
      phone1: '',
      phone2: '',
      phone3: '',
      district: '',
      town: '',
      systemStatus: '',
    });
    setMessage({ text: '', type: '' });
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerSection}>
        <h1 style={styles.pageTitle}>Insert New Clinics Data</h1>
        
        {/* Mission Statement */}
        <div style={styles.missionCard}>
          <div style={styles.missionIcon}>🎯</div>
          <div>
            <h3 style={styles.missionTitle}>Our Mission: 1000 Clinics with MEDCORE</h3>
            <p style={styles.missionText}>
              We're on a mission to empower 1000 clinics with MEDCORE - transforming healthcare 
              management through technology, one clinic at a time.
            </p>
          </div>
        </div>
      </div>
      
      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          borderColor: message.type === 'success' ? '#c3e6cb' : '#f5c6cb',
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.contentBox}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Clinic Name - Required */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="clinicName">
              Clinic Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="clinicName"
              name="clinicName"
              value={formData.clinicName}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter clinic name"
              required
            />
          </div>

          {/* Owner Name - Optional */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="ownerName">
              Owner Name
            </label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter owner's name (optional)"
            />
          </div>

          {/* System Status - Required */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="systemStatus">
              Current System Status <span style={styles.required}>*</span>
            </label>
            <select
              id="systemStatus"
              name="systemStatus"
              value={formData.systemStatus}
              onChange={handleChange}
              style={styles.select}
              required
            >
              {systemOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Status indicators */}
            <div style={styles.statusIndicators}>
              {formData.systemStatus === 'clinic_pro' && (
                <div style={styles.statusBadgeSuccess}>
                  ✅ Already using MEDCORE
                </div>
              )}
              {formData.systemStatus === 'no_system' && (
                <div style={styles.statusBadgeWarning}>
                  ⏳ No system yet - Great opportunity!
                </div>
              )}
              {formData.systemStatus === 'other_system' && (
                <div style={styles.statusBadgeInfo}>
                  🔄 Using another system - Potential conversion
                </div>
              )}
              {formData.systemStatus === 'interested' && (
                <div style={styles.statusBadgePrimary}>
                  💡 Interested in MEDCORE - High potential!
                </div>
              )}
            </div>
          </div>

          {/* Email - Optional */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter email address (optional)"
            />
          </div>

          {/* Phone Numbers */}
          <div style={styles.phoneGroup}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phone1">
                Primary Phone <span style={styles.required}>*</span>
              </label>
              <input
                type="tel"
                id="phone1"
                name="phone1"
                value={formData.phone1}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter primary phone number"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phone2">
                Secondary Phone
              </label>
              <input
                type="tel"
                id="phone2"
                name="phone2"
                value={formData.phone2}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter secondary phone (optional)"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phone3">
                Tertiary Phone
              </label>
              <input
                type="tel"
                id="phone3"
                name="phone3"
                value={formData.phone3}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter tertiary phone (optional)"
              />
            </div>
          </div>

          {/* District and Town */}
          <div style={styles.locationGroup}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="district">
                District <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter district"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="town">
                Town
              </label>
              <input
                type="text"
                id="town"
                name="town"
                value={formData.town}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter town (optional)"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="notes">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Add any additional notes about this clinic (optional)"
              rows="3"
            />
          </div>

          {/* Form Actions */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Add Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    flex: 1,
    padding: '30px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  headerSection: {
    marginBottom: '30px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  missionCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
    borderRadius: '12px',
    padding: '24px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
  },
  missionIcon: {
    fontSize: '40px',
  },
  missionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: 'white',
  },
  missionText: {
    fontSize: '14px',
    opacity: 0.9,
    lineHeight: '1.5',
    margin: 0,
  },
  contentBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)',
    maxWidth: '800px',
    margin: '0 auto',
  },
  message: {
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid transparent',
    fontSize: '14px',
    maxWidth: '800px',
    margin: '0 auto 24px auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
    marginBottom: '8px',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  },
  required: {
    color: '#dc3545',
    marginLeft: '2px',
  },
  statusIndicators: {
    marginTop: '10px',
  },
  statusBadgeSuccess: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px',
  },
  statusBadgeWarning: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px',
  },
  statusBadgeInfo: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#cce5ff',
    color: '#004085',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px',
  },
  statusBadgePrimary: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px',
  },
  phoneGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  locationGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #eaeaea',
  },
  clearButton: {
    padding: '12px 28px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#545b62',
      transform: 'translateY(-1px)',
    },
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: '#1a365d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#0d243f',
      transform: 'translateY(-1px)',
    },
  },
};

// Media queries
const mediaStyles = `
  @media (max-width: 768px) {
    .mission-card {
      flex-direction: column;
      text-align: center;
      padding: 20px;
    }
    
    .mission-icon {
      font-size: 32px;
    }
    
    .phone-group,
    .location-group {
      grid-template-columns: 1fr;
    }
    
    .button-group {
      flex-direction: column;
    }
    
    .status-indicators {
      text-align: center;
    }
  }
`;

// Add media query styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mediaStyles;
document.head.appendChild(styleSheet);

export default InsertClinics;
