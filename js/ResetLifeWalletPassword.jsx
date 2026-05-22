import React, { useState } from 'react';
import JSEncrypt from 'jsencrypt';
import { useParams } from 'react-router-dom';

const ResetLifeWalletPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Encrypt the password
      const publicKey = `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyd2UMPL8blglJo5Bifv0
    hLIP50pki7ujRkQf3NEgba2HtA4nC4yzR2qC7+/DwfgMNWnDDIIyfGC9wZ8IZHL6
    3L1nsoncPE8klToykvEfWlz0QYW9pX9zD7QxRPtLY0tqQzNr7UWgMBy70GFjE60R
    MNdL6XPir3ghGym0HEEqbgC7zSz1mfWoQOK3jUyDHwKR7r7QbDVrysKe8ebsK5n/
    BDnKHRfp8gEqZPFs7pcgPLY2o1lgchLfphVgoaWwOsBObGR3qtPyQ7PALvSQqIwe
    XdeRvElGFTiEJrpbgK3X7w79cRdOXODeuM/WzNPaUb/dS6n6hOBlaY7iILgkZdBW
    UwIDAQAB
    -----END PUBLIC KEY-----`;

      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(publicKey);
      const encryptedPassword = encrypt.encrypt(newPassword);

      if (!encryptedPassword) {
        throw new Error('Encryption failed');
      }

      // Send to server
      const response = await fetch('https://doublecash.ltd:8080/newpassword.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: encryptedPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          text: 'Password reset successfully! Please reopen your LifeWallet app and use your new password.', 
          type: 'success' 
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Show specific server error if provided
        const errorMsg = data.message || data.error || 'Failed to reset password';
        throw new Error(errorMsg);
      }
    } catch (error) {
      setMessage({ 
        text: error.message || 'An error occurred during password reset', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Inline styles
  const styles = {
    container: {
      maxWidth: '500px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      width: '90%',
      marginTop: '2rem',
      marginBottom: '2rem'
    },
    heading: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      fontSize: '1.8rem',
      fontWeight: '600',
      color: '#000'
    },
    message: {
      padding: '1rem',
      marginBottom: '1.5rem',
      borderRadius: '4px',
      textAlign: 'center'
    },
    error: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      border: '1px solid #ef9a9a'
    },
    success: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      border: '1px solid #a5d6a7'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#000'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #000',
      borderRadius: '4px',
      fontSize: '1rem',
      backgroundColor: '#fff',
      color: '#000',
      boxSizing: 'border-box'
    },
    button: {
      padding: '0.75rem 2rem',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      display: 'inline-block',
      margin: '0 auto',
      width: 'auto'
    },
    buttonDisabled: {
      backgroundColor: '#9e9e9e',
      cursor: 'not-allowed'
    },
    buttonHover: {
      backgroundColor: '#424242'
    },
    '@media (max-width: 600px)': {
      container: {
        padding: '1.5rem'
      },
      heading: {
        fontSize: '1.5rem'
      }
    }
  };

  // Apply responsive styles
  const responsiveStyles = {
    ...styles,
    container: {
      ...styles.container,
      ...(window.innerWidth <= 600 ? styles['@media (max-width: 600px)'].container : {})
    },
    heading: {
      ...styles.heading,
      ...(window.innerWidth <= 600 ? styles['@media (max-width: 600px)'].heading : {})
    }
  };

  // Dynamic button style
  const buttonStyle = loading 
    ? { ...styles.button, ...styles.buttonDisabled } 
    : styles.button;

  return (
    <div style={responsiveStyles.container}>
      <h2 style={responsiveStyles.heading}>Reset Your LifeWallet Password</h2>
      
      {message.text && (
        <div style={{ 
          ...styles.message, 
          ...(message.type === 'error' ? styles.error : styles.success) 
        }}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="newPassword" style={styles.label}>New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="8"
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="8"
            style={styles.input}
          />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={buttonStyle}
            onMouseOver={!loading ? (e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor : null}
            onMouseOut={!loading ? (e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor : null}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetLifeWalletPassword;