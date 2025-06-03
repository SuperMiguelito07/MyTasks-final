import React, { memo } from 'react';

/**
 * Componente de carga optimizado que se muestra durante la carga de componentes lazy
 * Utiliza memo para evitar renderizaciones innecesarias
 */
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p style={{ marginTop: '20px' }}>Carregant...</p>
    </div>
  );
});

export default LoadingFallback;
