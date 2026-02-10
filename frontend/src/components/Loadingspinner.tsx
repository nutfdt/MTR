// src/components/LoadingSpinner.tsx

import React from 'react';
import '../styles/Loadingspinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Recherche en cours...</p>
    </div>
  );
};

export default LoadingSpinner;