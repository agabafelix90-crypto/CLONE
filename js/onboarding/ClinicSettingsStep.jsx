
import React, { useEffect, useState } from 'react';
import { Typography, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { urls } from '../config.dev';
import { getTokenFromUrlOrSession } from '../authUtils';

export default function ClinicSettingsStep({ onNext, onBack }) {
  const [clinic, setClinic] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      setFetching(true);
      setError('');
      try {
        const token = getTokenFromUrlOrSession();
        const res = await fetch(urls.fetchclinicdetails, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data && data.name) {
          setClinic({ name: data.name, email: data.email });
        } else {
          setError(data?.message || data?.error || 'Failed to fetch clinic details.');
        }
      } catch (err) {
        setError('Network error while fetching clinic details.');
      } finally {
        setFetching(false);
      }
    };
    fetchClinic();
  }, []);

  const handleChange = (e) => {
    setClinic({ ...clinic, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!clinic.name || !clinic.email) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.updateclinic, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: clinic.name, email: clinic.email }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Clinic details updated.');
      } else {
        setError(data?.message || data?.error || 'Failed to update clinic details.');
      }
    } catch (err) {
      setError('Network error while updating clinic details.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = clinic.name && clinic.email;

  return (
    <div>
      <Typography variant="h5" gutterBottom>Clinic Settings</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Configure your clinic's details and preferences.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {fetching ? <CircularProgress /> : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <TextField
            label="Clinic Name"
            name="name"
            value={clinic.name}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            label="Clinic Email"
            name="email"
            value={clinic.email}
            onChange={handleChange}
            disabled={loading}
          />
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </form>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button onClick={onBack} disabled={loading}>Back</Button>
        <Button variant="contained" color="primary" onClick={onNext} disabled={!canContinue || loading}>
          Continue
        </Button>
      </div>
    </div>
  );
}
