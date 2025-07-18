import React, { useState } from 'react';
import { Button } from './Button';

interface ToolUseCardProps {
  toolName: string;
  toolId: string;
  input: any;
  result?: any;
  timestamp: string;
}

export const ToolUseCard: React.FC<ToolUseCardProps> = ({ 
  toolName, 
  toolId, 
  input, 
  result, 
  timestamp 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getToolEmoji = (name: string) => {
    switch (name) {
      case 'TodoWrite':
        return '✅';
      case 'Edit':
      case 'MultiEdit':
        return '✏️';
      case 'Read':
        return '📖';
      case 'Write':
        return '📝';
      case 'Bash':
        return '⚡';
      case 'Glob':
        return '🔍';
      case 'Grep':
        return '🕵️';
      default:
        return '🛠️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="MessageCard">
      <div className="MessageCard__header">
        <div className="MessageCard__header-left">
          <span className="MessageCard__badge MessageCard__badge--assistant">
            {getToolEmoji(toolName)} {toolName}
          </span>
        </div>
        
        <span className="MessageCard__timestamp">
          {formatTimestamp(timestamp)}
        </span>
      </div>

      <div className="MessageCard__tool">
        <div className="MessageCard__tool-use">
          <div className="MessageCard__tool-header">
            Tool Use: {toolName}
          </div>
          {expanded && (
            <div>
              <div className="MessageCard__tool-id">
                ID: {toolId}
              </div>
              <pre className="MessageCard__tool-input">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {result && (
          <div className="MessageCard__tool-result">
            <div className="MessageCard__tool-header">
              Tool Result
            </div>
            {expanded && (
              <div>
                <pre className="MessageCard__tool-output">
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="MessageCard__expand-button">
        <Button onClick={() => setExpanded(!expanded)} className="button-secondary button-xs">
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
    </div>
  );
};