import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ChatMessage, ChatSession, ProjectDirectory } from '../types';
import { annotateInternalMessages } from './annotateInternalMessages';

export interface AnalyticsData {
  toolUsage: { name: string; count: number }[];
  tokenUsage: { name: string; tokens: number }[];
  chatStats: {
    totalChats: number;
    totalMessages: number;
    averageMessagesPerChat: number;
  };
  timeStats: {
    totalTimeSpan: string;
    firstChatDate: string;
    lastChatDate: string;
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  console.log('[getAnalytics] Starting analytics calculation');
  
  const claudeDir = path.join(os.homedir(), '.claude', 'projects');
  
  if (!fs.existsSync(claudeDir)) {
    console.log('[getAnalytics] Claude directory does not exist');
    return getEmptyAnalytics();
  }

  const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`[getAnalytics] Found ${projectDirs.length} project directories`);

  const toolUsageMap = new Map<string, number>();
  const tokenUsageMap = new Map<string, number>();
  let totalChats = 0;
  let totalMessages = 0;
  const allTimestamps: string[] = [];

  for (const projectDir of projectDirs) {
    const projectPath = path.join(claudeDir, projectDir);
    const files = fs.readdirSync(projectPath)
      .filter(file => file.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        if (lines.length === 0) continue;
        
        const messages: ChatMessage[] = lines.map(line => JSON.parse(line));
        
        annotateInternalMessages(messages);
        
        if (messages.length > 0) {
          totalChats++;
          totalMessages += messages.length;
          
          // Collect timestamps
          messages.forEach(msg => {
            if (msg.timestamp) {
              allTimestamps.push(msg.timestamp);
            }
          });
          
          // Analyze tool usage and token usage
          messages.forEach(msg => {
            if (msg.message?.content && Array.isArray(msg.message.content)) {
              msg.message.content.forEach(item => {
                if (item.type === 'tool_use' && item.name) {
                  const toolName = item.name;
                  toolUsageMap.set(toolName, (toolUsageMap.get(toolName) || 0) + 1);
                }
              });
            }
            
            // Track token usage
            if (msg.message?.usage) {
              const usage = msg.message.usage;
              const inputTokens = usage.input_tokens || 0;
              const outputTokens = usage.output_tokens || 0;
              const totalTokensForMessage = inputTokens + outputTokens;
              
              if (totalTokensForMessage > 0) {
                // For now, we'll attribute all tokens to "Claude Assistant"
                // In the future, we could track which tools consumed tokens
                const toolName = "Claude Assistant";
                tokenUsageMap.set(toolName, (tokenUsageMap.get(toolName) || 0) + totalTokensForMessage);
              }
            }
          });
        }
      } catch (error) {
        console.error(`[getAnalytics] Error processing file ${filePath}:`, error);
        continue;
      }
    }
  }

  // Sort tool usage by frequency
  const toolUsage = Array.from(toolUsageMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  // Sort token usage by total tokens
  const tokenUsage = Array.from(tokenUsageMap.entries())
    .map(([name, tokens]) => ({ name, tokens }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10); // Top 10

  // Calculate time stats
  const sortedTimestamps = allTimestamps.sort();
  const firstChatDate = sortedTimestamps[0] || '';
  const lastChatDate = sortedTimestamps[sortedTimestamps.length - 1] || '';
  
  let totalTimeSpan = 'N/A';
  if (firstChatDate && lastChatDate && firstChatDate !== lastChatDate) {
    const firstDate = new Date(firstChatDate);
    const lastDate = new Date(lastChatDate);
    const diffInDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    totalTimeSpan = `${diffInDays} days`;
  }

  const analytics: AnalyticsData = {
    toolUsage,
    tokenUsage,
    chatStats: {
      totalChats,
      totalMessages,
      averageMessagesPerChat: totalChats > 0 ? Math.round((totalMessages / totalChats) * 10) / 10 : 0
    },
    timeStats: {
      totalTimeSpan,
      firstChatDate: firstChatDate ? new Date(firstChatDate).toLocaleDateString() : 'N/A',
      lastChatDate: lastChatDate ? new Date(lastChatDate).toLocaleDateString() : 'N/A'
    }
  };

  console.log('[getAnalytics] Analytics calculated:', {
    totalChats: analytics.chatStats.totalChats,
    totalMessages: analytics.chatStats.totalMessages,
    toolsFound: analytics.toolUsage.length,
    timeSpan: analytics.timeStats.totalTimeSpan
  });

  return analytics;
}

function getEmptyAnalytics(): AnalyticsData {
  return {
    toolUsage: [],
    tokenUsage: [],
    chatStats: {
      totalChats: 0,
      totalMessages: 0,
      averageMessagesPerChat: 0
    },
    timeStats: {
      totalTimeSpan: 'N/A',
      firstChatDate: 'N/A',
      lastChatDate: 'N/A'
    }
  };
}