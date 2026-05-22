
import React, { useEffect, useState } from 'react';
import { Typography, Button, TextField, Alert, CircularProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { urls } from '../config.dev';
import { getTokenFromUrlOrSession } from '../authUtils';

export default function DrugsStep({ onNext, onBack }) {
  const [drugs, setDrugs] = useState([]);
  const [name, setName] = useState('');
  const [generic, setGeneric] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchDrugs = async () => {
    setFetching(true);
    setError('');
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.fetchdrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDrugs(data);
      } else {
        setError(data?.message || data?.error || 'Failed to fetch drugs.');
      }
    } catch (err) {
      setError('Network error while fetching drugs.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleAddDrug = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !generic) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.insertdrugs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, generic_name: generic }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Drug added.');
        setName('');
        setGeneric('');
        fetchDrugs();
      } else {
        setError(data?.message || data?.error || 'Failed to add drug.');
      }
    } catch (err) {
      setError('Network error while adding drug.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrug = async (id) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.deletedrug, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Drug deleted.');
        fetchDrugs();
      } else {
        setError(data?.message || data?.error || 'Failed to delete drug.');
      }
    } catch (err) {
      setError('Network error while deleting drug.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = drugs.length > 0;

  return (
    <div>
      <Typography variant="h5" gutterBottom>Add Drugs/Services</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Add at least one drug or service to your clinic to continue.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleAddDrug} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          size="small"
          disabled={loading}
        />
        <TextField
          label="Generic Name"
          value={generic}
          onChange={e => setGeneric(e.target.value)}
          size="small"
          disabled={loading}
        />
        <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={<Add />}>
          {loading ? <CircularProgress size={18} /> : 'Add'}
        </Button>
      </form>
      {fetching ? (
        <CircularProgress />
      ) : (
        <List dense>
          {drugs.map(drug => (
            <ListItem key={drug.id} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDrug(drug.id)} disabled={loading}>
                <Delete />
              </IconButton>
            }>
              <ListItemText primary={drug.name} secondary={drug.generic_name} />
            </ListItem>
          ))}
        </List>
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
