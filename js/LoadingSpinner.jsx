import React from 'react';
import { PulseLoader } from 'react-spinners';  // Import the PulseLoader component

const LoadingSpinner = ({ color = '#3498db', size = 15, loading = true }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '50px auto' }}>
      <PulseLoader color={color} size={size} loading={loading} />
    </div>
  );
};

export default LoadingSpinner;
