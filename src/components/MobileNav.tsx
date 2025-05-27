import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './Notifications.css';

interface MobileNavProps {
  activeTab: 'projects' | 'tasks';
  setActiveTab: (tab: 'projects' | 'tasks') => void;
  onSettingsClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  activeTab, 
  setActiveTab,
  onSettingsClick
}) => {
  const { unreadCount } = useNotifications();

  return (
    <div className="mobile-nav">
      <button 
        className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
        onClick={() => setActiveTab('projects')}
        aria-label="Veure projectes"
      >
        <span className="nav-icon">📂</span>
        <span className="nav-text">Projectes</span>
      </button>
      
      <button 
        className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
        onClick={() => setActiveTab('tasks')}
        aria-label="Veure tasques"
      >
        <span className="nav-icon">📋</span>
        <span className="nav-text">Tasques</span>
      </button>
      
      <button 
        className="nav-item notification-nav"
        onClick={onSettingsClick}
        aria-label="Configuració i notificacions"
      >
        <span className="nav-icon">🔔</span>
        <span className="nav-text">Notificacions</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
};

export default MobileNav;
