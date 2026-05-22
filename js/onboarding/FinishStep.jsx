import React from 'react';
import { Typography, Button } from '@mui/material';

export default function FinishStep() {
  // TODO: Call backend to finish onboarding and redirect
  return (
    <div style={{ textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Onboarding Complete!</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your clinic is now set up and ready to use MEDCORE. You can now access the dashboard and all features.
      </Typography>
      <Button variant="contained" color="primary" href="/dashboard" sx={{ mt: 3 }}>
        Go to Dashboard
      </Button>
    </div>
  );
}
