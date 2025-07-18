import React, { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types';
import { MessageCard } from './MessageCard';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatViewerProps {
  session: ChatSession;
}

export const ChatSessionView: React.FC<ChatViewerProps> = ({ session }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, [session.sessionId]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getSessionDetails(session.sessionId, session.projectPath);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getProjectDisplayName = (session: ChatSession) => {
    // Try to get the actual path from the first message's cwd
    if (session.messages.length > 0) {
      const firstMessage = session.messages[0];
      if (firstMessage.cwd) {
        return firstMessage.cwd;
      }
    }
    // Fallback to the encoded directory name conversion
    return session.projectPath.replace(/^-Users-[^-]+-/, '').replace(/-/g, '/');
  };

  if (loading) {
    return (
      <div className="ChatViewer__loading">
        <LoadingSpinner 
          size={40} 
          message="Loading session details..." 
        />
      </div>
    );
  }

  return (
    <div className="ChatViewer">
      <div className="ChatViewer__header">
        <h2 className="ChatViewer__title">
          {getProjectDisplayName(session)}
        </h2>
        <div className="ChatViewer__meta">
          <div>Session ID: {session.sessionId}</div>
          <div>Started: {formatTimestamp(session.firstMessageTimestamp)}</div>
          <div>Last activity: {formatTimestamp(session.lastMessageTimestamp)}</div>
          <div>{session.messageCount} messages</div>
        </div>
      </div>

      <div className="ChatViewer__content">
        {messages.map((message, index) => (
          <MessageCard 
            key={`${message.uuid}-${index}`} 
            message={message} 
          />
        ))}
      </div>
    </div>
  );
};