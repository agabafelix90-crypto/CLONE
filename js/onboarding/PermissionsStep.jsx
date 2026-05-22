import React, { useEffect, useState } from 'react';
import { Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText, Checkbox, FormGroup, FormControlLabel, IconButton } from '@mui/material';
import { urls } from '../config.dev';
import { getTokenFromUrlOrSession } from '../authUtils';
import { Edit } from '@mui/icons-material';

const DEFAULT_PERMISSIONS = [
  'view_dashboard',
  'view_sales',
  'view_inventory',
  'manage_employees',
];

export default function PermissionsStep({ onNext, onBack }) {
  const [employees, setEmployees] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(null);

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
        // Initialize permissions state
        const perms = {};
        data.forEach(emp => {
          perms[emp.Name] = { ...DEFAULT_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p]: false }), {}) };
        });
        setPermissions(perms);
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

  const handlePermissionChange = (empName, perm) => {
    setPermissions(prev => ({
      ...prev,
      [empName]: {
        ...prev[empName],
        [perm]: !prev[empName][perm],
      },
    }));
  };

  const handleSavePermissions = async (empName) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = getTokenFromUrlOrSession();
      const res = await fetch(urls.updatepermissions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          employeeName: empName,
          permissions: permissions[empName],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Permissions updated for ${empName}.`);
        setEditing(null);
      } else {
        setError(data?.message || data?.error || 'Failed to update permissions.');
      }
    } catch (err) {
      setError('Network error while updating permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>Set Employee Permissions</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Set permissions for each employee. You can edit these later in settings.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {fetching ? (
        <CircularProgress />
      ) : (
        <List dense>
          {employees.map(emp => (
            <ListItem key={emp.Name} alignItems="flex-start">
              <ListItemText primary={emp.Name} secondary={emp.Role} />
              {editing === emp.Name ? (
                <FormGroup row>
                  {DEFAULT_PERMISSIONS.map(perm => (
                    <FormControlLabel
                      key={perm}
                      control={
                        <Checkbox
                          checked={permissions[emp.Name]?.[perm] || false}
                          onChange={() => handlePermissionChange(emp.Name, perm)}
                          disabled={loading}
                        />
                      }
                      label={perm.replace(/_/g, ' ')}
                    />
                  ))}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSavePermissions(emp.Name)}
                    disabled={loading}
                    sx={{ ml: 2 }}
                  >
                    {loading ? <CircularProgress size={18} /> : 'Save'}
                  </Button>
                </FormGroup>
              ) : (
                <IconButton onClick={() => setEditing(emp.Name)}>
                  <Edit />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button onClick={onBack} disabled={loading}>Back</Button>
        <Button variant="contained" color="primary" onClick={onNext} disabled={loading}>
          Continue
        </Button>
      </div>
    </div>
  );
}
