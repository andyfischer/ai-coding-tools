import * as Db from './database';
import { getProcessLogs } from './logs';
interface LogsCommandOptions {
    cwd?: string; // Current working directory
    commandName?: string; // Name of the command to show logs for (defaults to "default")
    limit?: number; // Number of log lines to show
}
export async function handleLogs(options: LogsCommandOptions): Promise<void> {
    const cwd = options.cwd || process.cwd();
    const commandName = options.commandName || 'default';
    const limit = options.limit || 100;
    // Get logs using the command name and working directory
    const logs = getProcessLogs({
        commandName,
        workingDirectory: cwd,
        limit
    });
    if (logs.length === 0) {
        console.log(`No logs found for command '${commandName}' in directory '${cwd}'.`);
        return;
    }
    // Find the most recent process info for display
    let targetProcess: Db.ProcessRow | undefined;
    // First check running processes
    for (const process of Db.getRunningProcesses()) {
        if (process.working_directory === cwd && process.command_name === commandName) {
            targetProcess = process;
            break;
        }
    }
    // If no running process found, look for the most recent stopped process
    if (!targetProcess) {
        const allProcesses = Db.getAllProcesses();
        for (const process of allProcesses) {
            if (process.command_name === commandName && process.working_directory === cwd) {
                targetProcess = process;
                break;
            }
        }
    }
    // Display process info if found
    if (targetProcess) {
        const status = targetProcess.is_running === Db.RunningStatus.running ? 'running' : 'stopped';
        const startTime = new Date(targetProcess.start_time * 1000).toLocaleString();
        console.log(`=== Logs for '${commandName}' (${status}, started: ${startTime}) ===`);
    }
    else {
        console.log(`=== Logs for '${commandName}' ===`);
    }
    // Reverse logs to show chronological order (oldest first)
    const sortedLogs = logs.reverse();
    // Display logs
    for (const log of sortedLogs) {
        const timestamp = new Date(log.timestamp * 1000).toLocaleTimeString();
        let logTypePrefix: string;
        let formattedContent: string;
        if (log.log_type === Db.LogType.stderr) {
            logTypePrefix = '[stderr]';
            formattedContent = log.content;
        }
        else if (log.log_type === Db.LogType.process_has_exited) {
            logTypePrefix = '[process]';
            formattedContent = `🔴 ${log.content}`;
        }
        else {
            logTypePrefix = '[stdout]';
            formattedContent = log.content;
        }
        console.log(`${timestamp} ${logTypePrefix} ${formattedContent}`);
    }
}
