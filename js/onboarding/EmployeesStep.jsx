import React, { useEffect, useState } from 'react';
import { Typography, Button, TextField, Alert, CircularProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { urls } from '../config.dev';
import { getTokenFromUrlOrSession } from '../authUtils';

export default function EmployeesStep({ onNext, onBack }) {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchEmployees = async () => {
    setFetching(true);
    setError('');
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.fetchemployees, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEmployees(data);
      } else {
        setError(data?.message || data?.error || 'Failed to fetch employees.');
      }
    } catch (err) {
      setError('Network error while fetching employees.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email || !role) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.addemployee, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, email, role }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Employee added.');
        setName('');
        setEmail('');
        setRole('');
        fetchEmployees();
      } else {
        setError(data?.message || data?.error || 'Failed to add employee.');
      }
    } catch (err) {
      setError('Network error while adding employee.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.deleteEmployee, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccess('Employee deleted.');
        fetchEmployees();
      } else {
        setError(data?.message || data?.error || 'Failed to delete employee.');
      }
    } catch (err) {
      setError('Network error while deleting employee.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = employees.length > 0;

  return (
    <div>
      <Typography variant="h5" gutterBottom>Add Employees</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Add at least one employee to your clinic to continue.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          size="small"
          disabled={loading}
        />
        <TextField
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          size="small"
          disabled={loading}
        />
        <TextField
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value)}
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
          {employees.map(emp => (
            <ListItem key={emp.id} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEmployee(emp.id)} disabled={loading}>
                <Delete />
              </IconButton>
            }>
              <ListItemText primary={emp.name} secondary={emp.email + (emp.role ? ` (${emp.role})` : '')} />
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
