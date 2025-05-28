import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Notifications.css';

const NotificationSettings: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manejar el guardado de preferencias
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    
    // Aquí se implementaría la lógica para guardar las preferencias en la base de datos
    // Por ahora, simulamos una operación exitosa
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="notification-settings">
      <h2>Preferencias de notificaciones</h2>
      
      <form onSubmit={handleSavePreferences}>
        <div className="settings-group">
          <h3>Notificaciones en la aplicación</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
              />
              Recibir notificaciones en la aplicación
            </label>
            <p className="setting-description">
              Recibirás notificaciones dentro de la aplicación sobre tareas, proyectos y actualizaciones.
            </p>
          </div>
        </div>
        
        <div className="settings-group">
          <h3>Notificaciones por correo electrónico</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              Recibir notificaciones por correo electrónico
            </label>
            <p className="setting-description">
              Recibirás correos electrónicos sobre tareas importantes, fechas límite y actualizaciones de proyectos.
            </p>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="save-button"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </button>
        
        {saveSuccess && (
          <div className="success-message">
            ¡Preferencias guardadas correctamente!
          </div>
        )}
      </form>
    </div>
  );
};

export default NotificationSettings;
