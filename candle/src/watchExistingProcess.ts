import * as Db from './database';
import { getProcessLogs } from './logs';
import { LogType, RunningStatus } from './database';
import { consoleLogSystemMessage, consoleLogRow } from './logs'

const INITIAL_LOG_COUNT = 100;

interface WatchOptions {
    launchId: number; // ID of the process to watch
    exitAfterMs?: number; // Optional timeout to exit watching after a certain period
    consoleOutputFormat: 'pretty' | 'json'
}

export async function watchExistingProcess(options: WatchOptions): Promise<void> {
    const { launchId, exitAfterMs, consoleOutputFormat } = options;
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

    // Get process info to use working directory and command name for logs
    const processInfo = Db.getProcessByLaunchId(launchId);
    if (!processInfo) {
        consoleLogSystemMessage(consoleOutputFormat, `Process with launch ID ${launchId} not found`);
        return;
    }
    
    // Initial log fetch - limited to past 100 messages.
    // Use launchId for specificity since we're watching a specific process instance
    const initialLogs = getProcessLogs({ launchId, limit: INITIAL_LOG_COUNT });
    printLogs(initialLogs);
    
    while (watching) {
        const currentProcess = Db.getProcessByLaunchId(launchId);
        if (!currentProcess) {
            consoleLogSystemMessage(consoleOutputFormat, `Process with launch ID ${launchId} not found`);
            break;
        }
        
        // Print any new logs since the last seen log ID
        // Continue using launchId for incremental log tracking
        const logs = getProcessLogs({ launchId, afterLogId: lastSeenLogId });
        printLogs(logs);
        
        // Check if process is still running
        if (currentProcess.is_running !== RunningStatus.running) {
            const statusText = currentProcess.exit_code === 0 ? 'completed successfully' : `failed with exit code ${currentProcess.exit_code}`;
            consoleLogSystemMessage(consoleOutputFormat, `Process with launch ID ${launchId} has stopped: ${statusText}`);
            break;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // Clean up timeout if it exists
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    
    consoleLogSystemMessage(consoleOutputFormat, 'Stopped watching, process is still running in background');
}
