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
      >
        <span className="nav-icon">📁</span>
        <span className="nav-text">Proyectos</span>
      </button>
      
      <button 
        className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
        onClick={() => setActiveTab('tasks')}
      >
        <span className="nav-icon">✓</span>
        <span className="nav-text">Tareas</span>
      </button>
      
      <button 
        className="nav-item notification-nav"
        onClick={onSettingsClick}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-text">Ajustes</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
};

export default MobileNav;
