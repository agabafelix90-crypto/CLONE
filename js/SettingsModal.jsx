import React, { useState } from 'react';
import JSEncrypt from 'jsencrypt';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { urls } from './config.dev'; // Import URLs from config.dev
import './settings.css'; // Import CSS for styling

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAup3FU135mAvJT6OheYW3
pQyWf6jvS4duUMY4cXrlJXyGqu8HqvTU0ewPy6w2HhCPxWboNclkAkPhOCc4URNT
x1Grg+mCsWmfhVimP2wtfmlBCJ09cyDMYf93iGj8RFf3CshY5yhppT/pX+RgTuXw
ClpOXe24CLG2VF9suNylk+ReAMLyOxaekYofAMBvvrD4+GYPJgvkTMXCXCKp2PnO
8+OjiltNMnoyqPEZoXHTV4EXtTrjYnwzSe0WZSSuzgVMhmtdx+IS4eisSumHV1eI
wBeZwI0bYGxDCedPRassmSFgTFqkkcgIXmEP1n5w/08S/QPr2G+myKTeRqp5RJA5
PQIDAQAB
-----END PUBLIC KEY-----`;

const SettingsModal = ({ token, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [clinicPassword, setClinicPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordType, setPasswordType] = useState(''); // 'admin' or 'clinic'
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert('New password and confirm new password do not match.');
      return;
    }

    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);

    const encryptedOldPassword = encrypt.encrypt(oldPassword);
    const encryptedNewPassword = encrypt.encrypt(newPassword);

    setLoading(true);

    try {
      const response = await fetch(urls.changepasswords, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          old_password: encryptedOldPassword,
          new_password: encryptedNewPassword,
          password_type: passwordType,
        }),
      });

      setLoading(false);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordType('');

        // If admin password was changed from default 12345, logout the user
        if (passwordType === 'admin' && oldPassword === '12345') {
          alert('Admin password changed successfully. You will now be logged out and prompted to login with your new password.');
          // Clear local storage and redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return; // Exit early to prevent onClose
        }

        alert('Password changed successfully.');
        console.log('Password changed successfully:', data.message);
        onClose();
      } else if (data.error === "Old password does not match") {
        alert('Error: Old password does not match.');
        console.error('Error changing password:', data.error);
      } else {
        alert(`Error changing password: ${data.message || 'Unknown error'}`);
        console.error('Error changing password:', data.message || 'Unknown error');
      }
    } catch (error) {
      setLoading(false);
      alert('Oops! Something went wrong. Please check and confirm your old password is correct and you have an internet connection.');
      console.error('Error changing password:', error.message || error);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <h2>Change Password</h2>
        <div className="settings-form">
          <select
            value={passwordType}
            onChange={(e) => setPasswordType(e.target.value)}
          >
            <option value="">Select Password Type</option>
            <option value="admin">Admin Password</option>
            <option value="clinic">Clinic Password</option>
          </select>
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          <button
            onClick={handleChangePassword}
            disabled={
              !passwordType ||
              !oldPassword ||
              !newPassword ||
              newPassword !== confirmNewPassword ||
              loading
            }
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Change Password'}
          </button>
        </div>
        <button className="close-button1" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SettingsModal;
