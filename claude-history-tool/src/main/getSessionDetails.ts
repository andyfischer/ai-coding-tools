import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ChatMessage } from '../types';
import { annotateInternalMessages } from './annotateInternalMessages';

export async function getSessionDetails(sessionId: string, projectName: string): Promise<ChatMessage[]> {

  console.log(`[getSessionDetails] Getting session details for ${sessionId} in project ${projectName}`);

  const sessionFilePath = path.join(os.homedir(), '.claude', 'projects', projectName, `${sessionId}.jsonl`);
  
  try {
    const content = fs.readFileSync(sessionFilePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    const messages: ChatMessage[] = lines.map(line => JSON.parse(line));
    
    annotateInternalMessages(messages);
    return messages;
  } catch (error) {
    console.error(`Failed to read session file: ${sessionFilePath}`, error);
    return [];
  }
}

