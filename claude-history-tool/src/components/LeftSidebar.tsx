import React from 'react';
import { IoChatbubbles, IoStatsChart } from 'react-icons/io5';

export interface LeftSidebarProps {
  activeView: 'chats' | 'analytics';
  onViewChange: (view: 'chats' | 'analytics') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="left-sidebar">
      <button 
        className={`sidebar-button ${activeView === 'chats' ? 'active' : ''}`}
        onClick={() => onViewChange('chats')}
        title="Chats"
      >
        <IoChatbubbles size={24} />
      </button>
      
      <button 
        className={`sidebar-button ${activeView === 'analytics' ? 'active' : ''}`}
        onClick={() => onViewChange('analytics')}
        title="Analytics"
      >
        <IoStatsChart size={24} />
      </button>
    </div>
  );
};