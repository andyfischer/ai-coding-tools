import * as Db from './database';
import { getProcessLogs } from './logs';
import { LogType, RunningStatus } from './database';
import { LogIterator } from './LogIterator';

const POLL_INTERVAL = 1000; // 1 second
const LOG_COUNT_SEARCH_LIMIT = 1000;

interface WaitForLogOptions {
    projectDir: string;
    commandName: string;
    message: string;
    timeoutMs?: number; // Default to 60000ms (1 minute)
}

export async function handleWaitForLog(options: WaitForLogOptions) {
    const { projectDir, commandName, message, timeoutMs = 60000 } = options;
    
    // Get recent logs
    const logIterator = new LogIterator({ projectDir, commandName, limit: LOG_COUNT_SEARCH_LIMIT });
    const initialLogs = logIterator.getNextLogs();

    // Check if we have any logs at all for this process
    if (initialLogs.length === 0) {
        return {
            success: false,
            message: 'No process_has_started event found'
        };
    }

    // Check if we have any process_has_started events
    const hasProcessStarted = initialLogs.some(log => log.log_type === LogType.process_has_started);
    if (!hasProcessStarted) {
        return {
            success: false,
            message: 'No process_has_started event found'
        };
    }

    // Look for the message in existing logs
    for (const logEvent of initialLogs) {
        if (logEvent.content.includes(message)) {
            return {
                success: true,
                message: `Found message "${message}" in existing logs`
            };
        }
    }

    // Poll for logs until we find the message or timeout
    let timeStarted = Date.now();
    while (true) {
        if (Date.now() - timeStarted > timeoutMs) {
            return {
                success: false,
                message: `Timeout: Message "${message}" not found within ${timeoutMs}ms`
            };
        }

        const logs = logIterator.getNextLogs();
        for (const log of logs) {
            if (log.content.includes(message)) {
                return {
                    success: true,
                    message: `Found message "${message}" in logs`
                };
            }

            if (log.log_type === LogType.process_has_exited) {
                return {
                    success: false,
                    message: `Process exited before finding message "${message}"`
                };
            }

            if (log.log_type === LogType.process_has_started) {
                // We found the start of the process - ignore any messages after this.
                break;
            }
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
}