import { AnalyticsData } from '../main/getAnalytics';
import { ProjectDirectory, ChatMessage } from './index';

declare global {
  interface Window {
    electronAPI: {
      getChatSessions: () => Promise<ProjectDirectory[]>;
      getSessionDetails: (sessionId: string, projectName: string) => Promise<ChatMessage[]>;
      getAnalytics: () => Promise<AnalyticsData>;
      isNotificationDismissed: (contentCode: string) => Promise<boolean>;
      dismissNotification: (contentCode: string) => Promise<void>;
      getApiHostname: () => Promise<string>;
    };
  }
}

export {};