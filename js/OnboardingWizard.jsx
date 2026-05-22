import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper } from '@mui/material';

import WelcomeStep from './onboarding/WelcomeStep';
import AdminPasswordStep from './onboarding/AdminPasswordStep';
import EmployeesStep from './onboarding/EmployeesStep';
import PermissionsStep from './onboarding/PermissionsStep';
import DrugsStep from './onboarding/DrugsStep';
import ClinicSettingsStep from './onboarding/ClinicSettingsStep';
import FinishStep from './onboarding/FinishStep';

const steps = [
  'Welcome',
  'Admin Password',
  'Add Employees',
  'Set Permissions',
  'Add Drugs/Services',
  'Clinic Settings',
  'Finish',
];

export default function OnboardingWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  const handleStep = (step) => () => {
    setActiveStep(step);
  };
  const handleComplete = () => {
    setCompleted((prev) => ({ ...prev, [activeStep]: true }));
    handleNext();
  };

  function getStepContent(step) {
    switch (step) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <AdminPasswordStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <EmployeesStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <PermissionsStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <DrugsStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <ClinicSettingsStep onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <FinishStep />;
      default:
        return 'Unknown step';
    }
  }

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={completed[index]}>
              <StepLabel onClick={handleStep(index)}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ mt: 4 }}>{getStepContent(activeStep)}</Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
