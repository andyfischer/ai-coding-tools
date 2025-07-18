import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ChatMessage, ChatSession, ProjectDirectory } from '../types';
import { annotateInternalMessages } from './annotateInternalMessages';

export async function getChatSessions(): Promise<ProjectDirectory[]> {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects');
  
  console.log(`[getChatSessions] Starting scan of Claude directory: ${claudeDir}`);
  
  if (!fs.existsSync(claudeDir)) {
    console.log('[getChatSessions] Claude directory does not exist');
    return [];
  }

  const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`[getChatSessions] Found ${projectDirs.length} project directories:`, projectDirs);

  const projects: ProjectDirectory[] = [];
  const seenSessionIds = new Set<string>();
  const sessionSources = new Map<string, string>(); // Track where each session was first seen

  for (const projectDir of projectDirs) {
    const projectPath = path.join(claudeDir, projectDir);
    const files = fs.readdirSync(projectPath)
      .filter(file => file.endsWith('.jsonl'));

    console.log(`[getChatSessions] Project ${projectDir}: Found ${files.length} .jsonl files`);

    const sessions: ChatSession[] = [];

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        console.log(`[getChatSessions] File ${file}: ${lines.length} lines`);
        
        if (lines.length === 0) {
          console.log(`[getChatSessions] Skipping empty file: ${file}`);
          continue;
        }
        
        const messages: ChatMessage[] = lines.map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            console.error(`[getChatSessions] Failed to parse JSON at line ${index + 1} in ${file}:`, error);
            throw error;
          }
        });

        annotateInternalMessages(messages);
        
        if (messages.length > 0) {
          const sessionId = messages[0].sessionId;
          const sourceKey = `${projectDir}/${file}`;
          
          console.log(`[getChatSessions] Processing session ${sessionId} from ${sourceKey}`);
          
          // Validate sessionId exists and is a string
          if (!sessionId || typeof sessionId !== 'string') {
            console.warn(`[getChatSessions] Invalid or missing sessionId in ${sourceKey}, first message:`, messages[0]);
            continue;
          }
          
          // Check for duplicate session GUID with detailed logging
          if (seenSessionIds.has(sessionId)) {
            const originalSource = sessionSources.get(sessionId);
            console.error(`[getChatSessions] DUPLICATE SESSION DETECTED!`);
            console.error(`  Session ID: ${sessionId}`);
            console.error(`  Original source: ${originalSource}`);
            console.error(`  Duplicate source: ${sourceKey}`);
            console.error(`  Skipping duplicate session`);
            continue;
          }
          
          // Verify all messages in the file have the same sessionId
          const differentSessionIds = messages.filter(msg => msg.sessionId !== sessionId);
          if (differentSessionIds.length > 0) {
            console.warn(`[getChatSessions] Mixed session IDs in file ${sourceKey}:`);
            console.warn(`  Primary session: ${sessionId}`);
            console.warn(`  Other sessions found: ${[...new Set(differentSessionIds.map(msg => msg.sessionId))]}`);
          }
          
          seenSessionIds.add(sessionId);
          sessionSources.set(sessionId, sourceKey);
          
          const firstMessage = messages[0];
          const lastMessage = messages[messages.length - 1];
          
          sessions.push({
            sessionId,
            messages,
            firstMessageTimestamp: firstMessage.timestamp,
            lastMessageTimestamp: lastMessage.timestamp,
            projectPath: projectDir,
            messageCount: messages.length
          });
          
          console.log(`[getChatSessions] Successfully added session ${sessionId} (${messages.length} messages)`);
        }
      } catch (error) {
        console.error(`[getChatSessions] Error processing file ${filePath}:`, error);
        continue;
      }
    }

    if (sessions.length > 0) {
      console.log(`[getChatSessions] Project ${projectDir}: Successfully processed ${sessions.length} sessions`);
      
      // Sort sessions by last message timestamp
      sessions.sort((a, b) => 
        new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );

      projects.push({
        path: projectDir,
        sessions
      });
    } else {
      console.log(`[getChatSessions] Project ${projectDir}: No valid sessions found`);
    }
  }

  // Final validation: Check for any duplicate sessions that made it through
  const finalSessionIds = new Set<string>();
  let finalDuplicateCount = 0;
  
  for (const project of projects) {
    for (const session of project.sessions) {
      if (finalSessionIds.has(session.sessionId)) {
        console.error(`[getChatSessions] CRITICAL: Duplicate session in final result: ${session.sessionId}`);
        finalDuplicateCount++;
      }
      finalSessionIds.add(session.sessionId);
    }
  }

  console.log(`[getChatSessions] Final summary:`);
  console.log(`  Total projects: ${projects.length}`);
  console.log(`  Total unique sessions: ${finalSessionIds.size}`);
  console.log(`  Final duplicates detected: ${finalDuplicateCount}`);

  // Sort projects by most recent session
  projects.sort((a, b) => {
    const aLatest = new Date(a.sessions[0]?.lastMessageTimestamp || 0).getTime();
    const bLatest = new Date(b.sessions[0]?.lastMessageTimestamp || 0).getTime();
    return bLatest - aLatest;
  });

  return projects;
}