import React, { useState, useEffect } from "react";
import { urls } from "./config.dev";

const SMSSettingsModal = ({ token, onClose }) => {
  const [smsSettings, setSmsSettings] = useState({
    billPayment: false,
    birthdayMessage: false,
    debtReminder: false,
    customSingle: false,
    customGroup: false,
  });

  // Fetch the SMS settings on component mount
  useEffect(() => {
    const fetchSMSSettings = async () => {
      try {
        const response = await fetch(urls.fetchSMSsettings, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (response.ok) {
          // Update the state with the fetched data
          // Note: Adjust based on your actual API response structure
          setSmsSettings({
            billPayment: data.billPayment === "1",
            birthdayMessage: data.birthdayMessage === "1",
            debtReminder: data.debtReminder === "1",
            customSingle: data.customSingle === "1",
            customGroup: data.customGroup === "1",
          });
        } else {
          alert(data.error || "Failed to fetch SMS settings");
        }
      } catch (error) {
        alert("Error fetching SMS settings. Please try again.");
      }
    };

    fetchSMSSettings();
  }, [token]); // Re-fetch when token changes

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setSmsSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(urls.submitSmsSettings, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, smsSettings }),
      });
      const data = await response.json();
      alert(data.message || "Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings. Please try again.");
    }
  };

  // Function to format cost display
  const formatCostDisplay = (costPerChar, minCost) => {
    return `UGX ${costPerChar} per character (min: UGX ${minCost})`;
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={headerStyle}>SMS Settings</h2>
        <p style={nbStyle}>
          <strong>NB:</strong> SMS messages will be sent to only active clients.
          Cost is calculated per character with minimum charges as indicated.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          {smsOptions.map(({ name, label, costPerChar, minCost, description }) => (
            <div key={name} style={optionContainerStyle}>
              <div style={labelContainerStyle}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    name={name}
                    checked={smsSettings[name]}
                    onChange={handleChange}
                    style={checkboxStyle}
                  />
                  {label}
                </label>
                {description && <p style={descriptionStyle}>{description}</p>}
              </div>
              <div style={costContainerStyle}>
                <span style={costStyle}>{formatCostDisplay(costPerChar, minCost)}</span>
              </div>
            </div>
          ))}
          <div style={buttonContainerStyle}>
            <button type="submit" style={saveButtonStyle}>
              Save Settings
            </button>
            <button onClick={onClose} style={closeButtonStyle}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated SMS options with new pricing structure
const smsOptions = [
  { 
    name: "billPayment", 
    label: "SMS after bill payment (Balance + Feedback link) - automatic", 
    costPerChar: 0.5,
    minCost: 100,
    description: "Automatic SMS sent after bill payment"
  },
  { 
    name: "birthdayMessage", 
    label: "Birthday SMS to patients - automatic", 
    costPerChar: 0.6,
    minCost: 100,
    description: "Automatic birthday greetings to patients"
  },
  { 
    name: "debtReminder", 
    label: "Reminder for pending balances - automatic", 
    costPerChar: 0.5,
    minCost: 100,
    description: "Automatic reminders for outstanding balances"
  },
  { 
    name: "customSingle", 
    label: "Custom SMS to a single patient - manual", 
    costPerChar: 0.9,
    minCost: 150,
    description: "Manual custom messages to individual patients"
  },
  { 
    name: "customGroup", 
    label: "Custom SMS to a group of patients - manual", 
    costPerChar: 0.9,
    minCost: 150,
    description: "Manual bulk messages to multiple patients"
  },
];

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  borderRadius: "0px",
  padding: "25px",
  width: "850px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
  color: "black",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "15px",
  fontSize: "22px",
  fontWeight: "bold",
};

const nbStyle = {
  background: "#fff3cd",
  padding: "10px",
  borderRadius: "0px",
  color: "#856404",
  marginBottom: "15px",
  fontSize: "14px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
};

const optionContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "12px 10px",
  borderBottom: "1px solid #e0e0e0",
  marginBottom: "8px",
};

const labelContainerStyle = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  marginRight: "20px",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "4px",
  fontWeight: "bold",
  fontSize: "14px",
};

const descriptionStyle = {
  fontSize: "12px",
  color: "#666",
  margin: "0",
  marginLeft: "24px", // Align with checkbox text
  lineHeight: "1.4",
};

const costContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  minWidth: "220px",
};

const costStyle = {
  fontWeight: "bold",
  textAlign: "right",
  fontSize: "13px",
  color: "#2c3e50",
};

const checkboxStyle = {
  marginRight: "10px",
  marginTop: "3px",
};

const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '40px',
  marginTop: '20px',
  paddingTop: '20px',
  borderTop: '1px solid #e0e0e0',
};

const saveButtonStyle = {
  backgroundColor: 'green',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  minWidth: '150px',
};

const closeButtonStyle = {
  backgroundColor: 'red',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  minWidth: '150px',
};

export default SMSSettingsModal;