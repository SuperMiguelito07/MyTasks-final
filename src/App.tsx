// Arxiu principal que configura les rutes i el context de l'aplicació
import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/mobile.css'; 
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';

// Carregar components de forma diferida amb prefetch per millorar el rendiment inicial
const Auth = lazy(() => {
  // Prefetch Dashboard perquè estigui llest quan l'usuari iniciï sessió
  import('./pages/Dashboard');
  return import('./pages/Auth');
});
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Optimitzar el rendiment amb React.memo i useMemo
const App = React.memo(function App() {
  // Memoritzar les rutes per evitar re-renderitzacions innecessàries
  const routes = useMemo(() => (
    <Routes>
      {/* Ruta per a la pàgina d'autenticació */}
      <Route path="/auth" element={<Auth />} />
      {/* Ruta per al tauler de control */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Navigate to="/auth" />} />
    </Routes>
  ), []);

  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <div className="App">
            <Suspense fallback={<div>Loading...</div>}>
              {routes}
            </Suspense>
          </div>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
})

export default App;
