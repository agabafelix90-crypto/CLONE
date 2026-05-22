
import React, { useState } from 'react';
import { Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { urls } from '../config.dev';
import { getTokenFromUrlOrSession } from '../authUtils';

export default function AdminPasswordStep({ onNext, onBack }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Fill all password fields to continue.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.changepasswords, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          old_password: oldPassword,
          new_password: newPassword,
          password_type: 'admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Admin password updated. Continue setup below.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccess('');
          onNext();
        }, 1000);
      } else {
        setError(data.message || data.error || 'Unable to change password.');
      }
    } catch (err) {
      setError('Network error while changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>Set Admin Password</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        For security, please change your default admin password.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TextField
        label="Old Password"
        type="password"
        fullWidth
        margin="normal"
        value={oldPassword}
        onChange={e => setOldPassword(e.target.value)}
        disabled={loading}
      />
      <TextField
        label="New Password"
        type="password"
        fullWidth
        margin="normal"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        disabled={loading}
      />
      <TextField
        label="Confirm New Password"
        type="password"
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        disabled={loading}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button onClick={onBack} disabled={loading}>Back</Button>
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
