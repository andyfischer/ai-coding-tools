import React from 'react';

export enum BadgeType {
  User = 'user',
  Assistant = 'assistant',
  Internal = 'internal',
  Hook = 'hook',
  Tool = 'tool',
  ToolResult = 'tool-result'
}

interface BadgeProps {
  type: BadgeType;
  className?: string;
  toolNames?: string[];
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '', toolNames = [] }) => {
  const getBadgeContent = () => {
    switch (type) {
      case BadgeType.User:
        return '👤 User';
      case BadgeType.Assistant:
        return '🤖 Assistant';
      case BadgeType.Internal:
        return '🔧 Internal';
      case BadgeType.Hook:
        return '🪝 Hook';
      case BadgeType.Tool:
        return toolNames.length > 0 ? `🔧 Tool: ${toolNames.join(', ')}` : '🔧 Tool';
      case BadgeType.ToolResult:
        return '📤 ToolResult';
      default:
        return '';
    }
  };

  const getBadgeClass = () => {
    switch (type) {
      case BadgeType.User:
        return 'Badge--user';
      case BadgeType.Assistant:
        return 'Badge--assistant';
      case BadgeType.Internal:
        return 'Badge--internal';
      case BadgeType.Hook:
        return 'Badge--hook';
      case BadgeType.Tool:
        return 'Badge--tool';
      case BadgeType.ToolResult:
        return 'Badge--tool-result';
      default:
        return '';
    }
  };

  return (
    <span className={`Badge ${getBadgeClass()} ${className}`}>
      {getBadgeContent()}
    </span>
  );
};