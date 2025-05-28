import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/mobile.css'; // Importar estilos para dispositivos móviles
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import LoadingFallback from './components/LoadingFallback';

// Cargar componentes de forma diferida con prefetch para mejorar el rendimiento inicial
const Auth = lazy(() => {
  // Prefetch Dashboard para que esté listo cuando el usuario inicie sesión
  import('./pages/Dashboard');
  return import('./pages/Auth');
});
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Usamos el componente LoadingFallback optimizado que creamos anteriormente

// Optimizar el rendimiento con React.memo y useMemo
const App = React.memo(function App() {
  // Memoizar las rutas para evitar re-renderizaciones innecesarias
  const routes = useMemo(() => (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Navigate to="/auth" />} />
    </Routes>
  ), []);

  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <UserPreferencesProvider>
            <NotificationProvider>
              <div className="App">
                <Suspense fallback={<LoadingFallback />}>
                  {routes}
                </Suspense>
              </div>
            </NotificationProvider>
          </UserPreferencesProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
})

export default App;
