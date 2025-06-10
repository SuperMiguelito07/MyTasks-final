import React from 'react';

interface MobileNavProps {
  activeTab: 'projects' | 'tasks';
  setActiveTab: (tab: 'projects' | 'tasks') => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  activeTab, 
  setActiveTab
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
      
    </div>
  );
};

export default MobileNav;