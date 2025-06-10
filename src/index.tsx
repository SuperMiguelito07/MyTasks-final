// Arxiu d'entrada principal que renderitza l'aplicació React
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Renderitza el component principal App a l'element HTML amb id 'root'
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);