import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from './LoadingSpinner';
import { AnalyticsData } from '../main/getAnalytics';

export const AnalyticsPanel: React.FC = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      console.log('calling getAnalytics');
      return await window.electronAPI.getAnalytics();
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <LoadingSpinner 
          size={50} 
          message="Calculating analytics..." 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Analytics</h1>
          <p style={{ color: 'var(--color-error)' }}>Failed to load analytics: {String(error)}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Analytics</h1>
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }
  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics</h1>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Most Used Tools</h3>
          <div className="tool-stats">
            {analytics.toolUsage.length > 0 ? (
              analytics.toolUsage.map((tool, index) => (
                <div key={index} className="tool-item">
                  <span className="tool-name">{tool.name}</span>
                  <span className="tool-count">{tool.count} uses</span>
                </div>
              ))
            ) : (
              <div className="tool-item">
                <span className="tool-name">No tool usage data found</span>
                <span className="tool-count">-</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Token Usage</h3>
          <div className="token-stats">
            {analytics.tokenUsage.length > 0 ? (
              analytics.tokenUsage.map((token, index) => (
                <div key={index} className="token-item">
                  <span className="tool-name">{token.name}</span>
                  <span className="token-cost">{token.tokens.toLocaleString()} tokens</span>
                </div>
              ))
            ) : (
              <div className="token-item">
                <span className="tool-name">No token usage data found</span>
                <span className="token-cost">-</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Chat Statistics</h3>
          <div className="chat-stats">
            <div className="stat-item">
              <span className="stat-label">Total Chats</span>
              <span className="stat-value">{analytics.chatStats.totalChats}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Messages</span>
              <span className="stat-value">{analytics.chatStats.totalMessages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Messages/Chat</span>
              <span className="stat-value">{analytics.chatStats.averageMessagesPerChat}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};