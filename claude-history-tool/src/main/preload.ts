import { contextBridge, ipcRenderer } from 'electron';
import { ProjectDirectory, ChatMessage } from '../types';
import { AnalyticsData } from './getAnalytics';

const electronAPI = {
  getChatSessions: (): Promise<ProjectDirectory[]> => 
    ipcRenderer.invoke('get-chat-sessions'),
  
  getSessionDetails: (sessionId: string, projectName: string): Promise<ChatMessage[]> => 
    ipcRenderer.invoke('get-session-details', sessionId, projectName),
  
  getAnalytics: (): Promise<AnalyticsData> => 
    ipcRenderer.invoke('get-analytics'),
  
  isNotificationDismissed: (contentCode: string): Promise<boolean> => 
    ipcRenderer.invoke('is-notification-dismissed', contentCode),
  
  dismissNotification: (contentCode: string): Promise<void> => 
    ipcRenderer.invoke('dismiss-notification', contentCode),
  
  getApiHostname: (): Promise<string> => 
    ipcRenderer.invoke('get-api-hostname'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}