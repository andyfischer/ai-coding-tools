import React, { useState } from 'react';
import { FaDeezer, FaMagnifyingGlassPlus } from 'react-icons/fa6';
import { ChatMessage } from '../types';
import { Button } from './Button';
import { MetaCard } from './MetaCard';
import { Badge, BadgeType } from './Badge';
import { Tooltip } from './Tooltip';

interface MessageCardProps {
  message: ChatMessage;
}

interface ParsedMessageContent {
  textContent: Array<any>;
  toolUseContent: Array<any>;
  badgeType: BadgeType;
  toolNames: string[];
}

function parseMessage(message: ChatMessage): ParsedMessageContent {
  let textContent: Array<any> = [];
  const toolUseContent: Array<any> = [];
  const toolNames: string[] = [];

  let badgeType: BadgeType =
  message.type === 'user' ? BadgeType.User : BadgeType.Assistant;

  const messageContent = message.message?.content;

  if (typeof messageContent === 'string') {
    textContent.push(
      <div key={`text-0`} className="content">
        {messageContent}
      </div>
    );
  } else if (Array.isArray(messageContent)) {

      let itemIndex = 0;
      for (const contentItem of messageContent) {
        itemIndex++;  

        if (typeof contentItem === 'string') {
          textContent.push(
            <div key={`text-${itemIndex}`} className="content">
              {contentItem}
            </div>
          );
          continue;
        }

        switch (contentItem.type) {
          case 'tool_use':
            if (contentItem.name) {
              toolNames.push(contentItem.name);
            }
            toolUseContent.push(
              <pre key={`tool-use-${itemIndex}`} >
                {JSON.stringify(contentItem, null, 2)}
              </pre>
            );

            badgeType = BadgeType.Tool;
            break;

          case 'tool_result':
            toolUseContent.push(
              <pre key={`tool-use-${itemIndex}`} >
                {JSON.stringify(contentItem, null, 2)}
              </pre>
            );
            badgeType = BadgeType.ToolResult;
            break;
  
          case 'text':
            textContent.push(
              <div key={`text-${itemIndex}`} className="content">
                {contentItem?.text}
              </div>
            );
            break;
        }
      }
  }

  if (message.internalMessageType) {
    if (message.internalMessageType === 'hook') {
      badgeType = BadgeType.Hook;
    } else {
      badgeType = BadgeType.Internal;
    }
  }

  if (message.isMeta) {
    badgeType = BadgeType.Internal;
  }

  return {
    textContent,
    toolUseContent,
    badgeType,
    toolNames
  };
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const { textContent, toolUseContent, badgeType, toolNames } = parseMessage(message);
  const isBackgroundMessageByDefault = message.isMeta
    || toolUseContent.length > 0
    || badgeType === BadgeType.Hook
    || badgeType === BadgeType.Tool
    || badgeType === BadgeType.ToolResult
    || badgeType === BadgeType.Internal;

  const [contentExpanded, setContentExpanded] = useState(!isBackgroundMessageByDefault);
  const [fullJsonExpanded, setFullJsonExpanded] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderTokenUsage = () => {
    if (!message.message?.usage) return null;
    
    return (
      <div style={{ textAlign: 'left' }}>
        <div>Token Usage:</div>
        <div>Input: {message.message.usage.input_tokens || 0}</div>
        <div>Output: {message.message.usage.output_tokens || 0}</div>
        {message.message.usage.cache_creation_input_tokens && (
          <div>Cache Creation: {message.message.usage.cache_creation_input_tokens}</div>
        )}
      </div>
    );
  };

  // Parse the message content into a list of text and tool use/result items

  // Determine if this should use background styling (less prominent)

  const isForegroundMessage = contentExpanded || fullJsonExpanded;

  const cardClassName = isForegroundMessage ? "MessageCard message-foreground" : "MessageCard message-background";

  return (
    <div className={cardClassName} onClick={(evt) => {
      setContentExpanded(!contentExpanded)
      evt.stopPropagation();
    }}>
      <div className="header">
        <div className="header-left">
          <Badge type={badgeType} className="badge" toolNames={toolNames} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.message?.usage && (
            <Tooltip content={renderTokenUsage()}>
              <FaDeezer 
                style={{ 
                  cursor: 'pointer', 
                  color: 'var(--color-text-secondary)',
                  fontSize: '14px'
                }} 
              />
            </Tooltip>
          )}
          <Tooltip content="See Full JSON">
            <FaMagnifyingGlassPlus 
              onClick={(evt) => {
                setFullJsonExpanded(!fullJsonExpanded)
                evt.stopPropagation();
              }}
              style={{
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '14px'
              }}
            />
          </Tooltip>
        </div>
      </div>

      {contentExpanded && (
        <>
          <div onClick={(evt) => evt.stopPropagation()}>
            {textContent}
          </div>
          {toolUseContent}
        </>
      )}

      {/* temp - show the full message for debugging */} 
      {fullJsonExpanded && (
        <>
          <h3>Full Event JSON:</h3>
        <pre className="full-message">
          {JSON.stringify(message, null, 2)}
        </pre>
        </>
      )}
    </div>
  );
};