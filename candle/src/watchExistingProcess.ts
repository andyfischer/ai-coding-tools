import * as Db from './database';
import { getProcessLogs } from './logs';
import { LogType, RunningStatus } from './database';
import { consoleLogSystemMessage, consoleLogRow } from './logs'

const INITIAL_LOG_COUNT = 100;

interface WatchOptions {
    projectDir: string;
    commandName: string;
    exitAfterMs?: number; // Optional timeout to exit watching after a certain period
    consoleOutputFormat: 'pretty' | 'json'
}

export async function watchExistingProcess(options: WatchOptions): Promise<void> {
    const { projectDir, commandName, exitAfterMs, consoleOutputFormat } = options;
    let lastSeenLogId = 0;
    const pollInterval = 1000; // 1 second
    let watching = true;
    
    // Set up timeout if exitAfterMs is provided
    let timeoutId: NodeJS.Timeout | null = null;
    if (exitAfterMs && exitAfterMs > 0) {
        timeoutId = setTimeout(() => {
            consoleLogSystemMessage(consoleOutputFormat, `Exiting watch mode after ${exitAfterMs}ms timeout`);
            watching = false;
        }, exitAfterMs);
    }
    
    // Handle signals to stop watching
    const stopWatching = () => {
        watching = false;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };
    
    process.on('SIGINT', stopWatching);
    process.on('SIGTERM', stopWatching);

    function printLogs(logs: { id: number; content: string; log_type: LogType }[]): void {
        logs.forEach(log => {
            consoleLogRow(consoleOutputFormat, log);
            lastSeenLogId = Math.max(lastSeenLogId, log.id);
        });
    }

    // Initial log fetch - limited to past 100 messages.
    const initialLogs = getProcessLogs({ projectDir, commandName, limit: INITIAL_LOG_COUNT });
    printLogs(initialLogs);
    let processIsStillRunning = true;
    
    while (watching) {
        // Find the current process using projectDir and commandName
        const runningProcesses = Db.getRunningProcessesByProjectDir(projectDir);
        const currentProcess = runningProcesses.find(p => p.command_name === commandName);
        
        if (!currentProcess) {
            consoleLogSystemMessage(consoleOutputFormat, `Process '${commandName}' not found in project '${projectDir}'`);
            processIsStillRunning = false;
            break;
        }
        
        // Print any new logs since the last seen log ID
        const logs = getProcessLogs({ projectDir, commandName, afterLogId: lastSeenLogId });
        printLogs(logs);
        
        // Check if process is still running
        if (currentProcess.is_running !== RunningStatus.running) {
            const statusText = currentProcess.exit_code === 0 ? 'completed successfully' : `failed with exit code ${currentProcess.exit_code}`;
            consoleLogSystemMessage(consoleOutputFormat, `Process '${commandName}' has stopped: ${statusText}`);
            processIsStillRunning = false;
            break;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // Clean up timeout if it exists
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    
    if (processIsStillRunning)
        consoleLogSystemMessage(consoleOutputFormat, 'Stopped watching, process is still running in background');
}
