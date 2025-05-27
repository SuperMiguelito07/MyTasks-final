import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <UserPreferencesProvider>
            <NotificationProvider>
              <div className="App">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/" element={<Navigate to="/auth" />} />
                </Routes>
              </div>
            </NotificationProvider>
          </UserPreferencesProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
