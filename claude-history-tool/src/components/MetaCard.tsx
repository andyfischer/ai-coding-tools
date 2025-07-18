import React, { useState } from 'react';
import { Button } from './Button';

interface MetaCardProps {
  content: string;
  timestamp: string;
  level?: string;
  toolUseID?: string;
  isHiddenByDefault?: boolean;
}

export const MetaCard: React.FC<MetaCardProps> = ({ 
  content, 
  timestamp, 
  level = 'info',
  toolUseID,
  isHiddenByDefault = true
}) => {
  const [expanded, setExpanded] = useState(!isHiddenByDefault);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🐛';
      default:
        return '📋';
    }
  };

  const getToolEmoji = (content: string) => {
    if (content.includes('TodoWrite')) {
      return '✅';
    }
    if (content.includes('Edit')) {
      return '✏️';
    }
    if (content.includes('Read')) {
      return '📖';
    }
    if (content.includes('Write')) {
      return '📝';
    }
    if (content.includes('Bash')) {
      return '⚡';
    }
    return '🔧';
  };

  const displayEmoji = content.includes('PreToolUse') || content.includes('PostToolUse') 
    ? getToolEmoji(content) 
    : getLevelEmoji(level);

  return (
    <div className="MessageCard">
      <div className="MessageCard__header">
        <div className="MessageCard__header-left">
          <span className="MessageCard__badge MessageCard__badge--user">
            {displayEmoji} System
          </span>
          {level && level !== 'info' && (
            <span className="text-tertiary text-sm">
              [{level.toUpperCase()}]
            </span>
          )}
        </div>
        
        <span className="MessageCard__timestamp">
          {formatTimestamp(timestamp)}
        </span>
      </div>

      {expanded && (
        <div className="MessageCard__content">
          {content}
        </div>
      )}

      {toolUseID && expanded && (
        <div className="MessageCard__usage">
          <div>Tool Use ID: {toolUseID}</div>
        </div>
      )}

      {isHiddenByDefault && (
        <div className="MessageCard__expand-button">
          <Button onClick={() => setExpanded(!expanded)} className="button-secondary button-xs">
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </div>
      )}
    </div>
  );
};