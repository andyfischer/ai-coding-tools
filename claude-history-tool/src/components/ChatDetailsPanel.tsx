import React from 'react';
import { ChatSession } from '../types';
import { ChatSessionView } from './ChatSessionView';

interface ChatDetailsPanelProps {
  session: ChatSession;
  onBackToList: () => void;
}

export const ChatDetailsPanel: React.FC<ChatDetailsPanelProps> = ({ 
  session, 
  onBackToList 
}) => {
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-md px-xl py-md" style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border-primary)'
      }}>
        <button 
          onClick={onBackToList}
          className="btn btn--secondary btn--small"
        >
          ← Back
        </button>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ChatSessionView session={session} />
      </div>
    </div>
  );
};