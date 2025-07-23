import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatList } from '../components/ChatList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LeftSidebar } from '../components/LeftSidebar';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { ChatDetailsPanel } from '../components/ChatDetailsPanel';
import { UpgradeBanner } from '../components/UpgradeBanner';
import { UpgradeModal } from '../components/UpgradeModal';
import { useUpgradeNotice } from '../hooks/useUpgradeNotice';
import { ChatSession } from '../types';
import '../style.scss';

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading, error } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      console.log('[ChatListPage] Calling getChatSessions...');
      console.log('[ChatListPage] electronAPI available:', !!window.electronAPI);
      
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.getChatSessions();
      console.log('[ChatListPage] getChatSessions result:', result);
      return result;
    },
    retry: 3,
    retryDelay: 1000,
    enabled: !!window.electronAPI, // Only run query when electronAPI is available
  });

  if (error) {
    console.error('Failed to load chat sessions:', error);
    return (
      <div className="h-full flex items-center justify-center flex-col" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="text-red-500 mb-4">Failed to load chat sessions</div>
        <div className="text-sm text-gray-600 mb-4">{error.message}</div>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['chatSessions'] })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleSessionSelect = (session: ChatSession) => {
    navigate(`/chat/${session.sessionId}`, { 
      state: { 
        expandedProjects: searchParams.get('expanded')?.split(',') || [],
        scrollPosition: window.scrollY 
      }
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <LoadingSpinner 
          size={50} 
          message="Loading chat history..." 
        />
      </div>
    );
  }

  return (
    <ChatList 
      projects={projects} 
      onSessionSelect={handleSessionSelect} 
      onRefresh={handleRefresh}
    />
  );
};

const ChatDetailsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      return await window.electronAPI.getChatSessions();
    },
  });

  const session = projects
    .flatMap(project => project.sessions)
    .find(s => s.sessionId === sessionId);

  const handleBackToList = () => {
    navigate('/', { replace: true });
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <LoadingSpinner 
          size={50} 
          message="Loading chat session..." 
        />
      </div>
    );
  }

  return (
    <ChatDetailsPanel 
      session={session} 
      onBackToList={handleBackToList}
    />
  );
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(true);
  const [showModal, setShowModal] = useState(true);
  
  const activeView = location.pathname === '/analytics' ? 'analytics' : 'chats';

  const handleViewChange = (view: 'chats' | 'analytics') => {
    if (view === 'analytics') {
      navigate('/analytics');
    } else {
      navigate('/');
    }
  };

  const { data: upgradeNotice } = useUpgradeNotice();

  const shouldShowBanner = showBanner && upgradeNotice?.bannerHtml;
  const shouldShowModal = showModal && upgradeNotice?.popupHtml && upgradeNotice.popupHtml !== '';

  return (
    <div className="h-screen flex flex-col">
      {shouldShowBanner && (
        <UpgradeBanner 
          html={upgradeNotice.bannerHtml!}
          contentCode={upgradeNotice.bannerContentCode!}
          onClose={() => setShowBanner(false)}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatListPage />} />
            <Route path="/analytics" element={<AnalyticsPanel />} />
            <Route path="/chat/:sessionId" element={<ChatDetailsPage />} />
            <Route path="*" element={<ChatListPage />} />
          </Routes>
        </main>
      </div>

      {shouldShowModal && (
        <UpgradeModal 
          isOpen={shouldShowModal}
          html={upgradeNotice.popupHtml!}
          contentCode={upgradeNotice.popupContentCode!}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

const queryClient = new QueryClient();

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}