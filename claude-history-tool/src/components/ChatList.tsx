import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { ProjectDirectory, ChatSession } from '../types';

interface ChatListProps {
  projects: ProjectDirectory[];
  onSessionSelect: (session: ChatSession) => void;
  onRefresh?: () => void;
}

  const getFirstUserMessage = (session: ChatSession): string => {
    const firstUserMessage = session.messages.find(msg => 
      msg.type === 'user' && !msg.isMeta && !msg.internalMessageType
    );

    if (firstUserMessage && firstUserMessage.message && typeof firstUserMessage.message.content === 'string') {
      return firstUserMessage.message.content.slice(0, 100) + '...';
    }
    return 'No user message found';
  };

export const ChatList: React.FC<ChatListProps> = ({ projects, onSessionSelect, onRefresh }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize expanded projects from URL params
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    const expanded = searchParams.get('expanded');
    return expanded ? new Set(expanded.split(',')) : new Set();
  });

  // Restore scroll position when coming back from a session
  useEffect(() => {
    if (location.state?.scrollPosition) {
      window.scrollTo(0, location.state.scrollPosition);
    }
    if (location.state?.expandedProjects) {
      setExpandedProjects(new Set(location.state.expandedProjects));
    }
  }, [location.state]);

  // Update URL when expanded projects change
  useEffect(() => {
    const expandedArray = Array.from(expandedProjects);
    if (expandedArray.length > 0) {
      setSearchParams({ expanded: expandedArray.join(',') });
    } else {
      setSearchParams({});
    }
  }, [expandedProjects, setSearchParams]);

  const getProjectDisplayName = useCallback((project: ProjectDirectory) => {
    // Try to get the actual path from the first message's cwd
    if (project.sessions.length > 0 && project.sessions[0].messages.length > 0) {
      const firstMessage = project.sessions[0].messages[0];
      if (firstMessage.cwd) {
        return firstMessage.cwd;
      }
    }
    // Fallback to the encoded directory name conversion
    return project.path.replace(/^-Users-[^-]+-/, '').replace(/-/g, '/');
  }, []);
  
  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return projects;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return projects.filter(project => {
      const projectName = getProjectDisplayName(project).toLowerCase();
      const hasMatchingProject = projectName.includes(searchLower);
      
      const hasMatchingSessions = false;
      // future:Also check if any session in the project matches
      
      /*
      const hasMatchingSessions = project.sessions.some(session => {
        const firstMessage = getFirstUserMessage(session).toLowerCase();
        return firstMessage.includes(searchLower);
      });
      */
      
      return hasMatchingProject || hasMatchingSessions;
    });
  }, [projects, searchTerm, getProjectDisplayName]);

  const toggleProject = (projectPath: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectPath)) {
      newExpanded.delete(projectPath);
    } else {
      newExpanded.add(projectPath);
    }
    setExpandedProjects(newExpanded);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };


  return (
    <div className="ChatList">
      <h2 className="ChatList__header">Session History</h2>
      
      <div className="ChatList__search">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ChatList__search-input"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="ChatList__search-clear"
            title="Clear search"
          >
            <IoClose />
          </button>
        )}
      </div>
      
      {filteredProjects.length === 0 && projects.length > 0 ? (
        <div className="ChatList__empty">
          <p>No projects found matching "{searchTerm}"</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="ChatList__empty">
          <p>No chat history found in ~/.claude/projects</p>
        </div>
      ) : (
        filteredProjects.map((project) => {
          const isExpanded = expandedProjects.has(project.path);
          return (
            <div key={project.path} className="ChatList__project">
              <div
                onClick={() => toggleProject(project.path)}
                className="ChatList__project-header"
              >
                <span className={`ChatList__project-arrow ${isExpanded ? 'ChatList__project-arrow--expanded' : ''}`}>
                  ▶
                </span>
                <span className="ChatList__project-name">
                  {getProjectDisplayName(project)}
                </span>
                <span className="ChatList__project-count">
                  ({project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''})
                </span>
              </div>
              
              {isExpanded && project.sessions.map((session) => (
                <a
                  key={session.sessionId}
                  href={`/chat/${session.sessionId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSessionSelect(session);
                  }}
                  className="ChatList__session"
                >
                  <div className="ChatList__session-content">
                    {getFirstUserMessage(session)}
                  </div>
                  
                  <div className="ChatList__session-meta">
                    <span>{formatTimestamp(session.lastMessageTimestamp)}</span>
                    <span>{session.messageCount} messages</span>
                  </div>
                </a>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};