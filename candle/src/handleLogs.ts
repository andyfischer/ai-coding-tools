import * as Db from './database';
import { getProcessLogs, consoleLogRow } from './logs';

interface LogsCommandOptions {
    projectDir: string;
    commandName: string; 
    limit?: number; // Number of log lines to show
}

export async function handleLogs(options: LogsCommandOptions): Promise<void> {
    const { projectDir, commandName, limit = 100 } = options;

    // Get logs using the command name and project directory
    const logs = getProcessLogs({ 
        commandName,
        limit,
        projectDir
    });
    
    if (logs.length === 0) {
        console.log(`No logs found for command '${commandName}' in project '${projectDir}'.`);
        return;
    }
    
    // Display logs
    for (const log of logs) {
        consoleLogRow('pretty', log);
    }
}
