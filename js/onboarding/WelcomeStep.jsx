import React from 'react';
import { Typography, Button } from '@mui/material';

export default function WelcomeStep({ onNext }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Welcome to MEDCORE Onboarding</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This guided setup will help you configure your clinic, secure your account, and get started quickly.
      </Typography>
      <Button variant="contained" color="primary" onClick={onNext} sx={{ mt: 3 }}>
        Get Started
      </Button>
    </div>
  );
}
