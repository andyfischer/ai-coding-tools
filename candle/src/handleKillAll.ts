import * as Db from './database';

export interface KillAllOutput {
    killedProcesses: {
        launchId: number;
        command: string;
        pid: number;
        wrapperPid?: number;
        directory: string;
    }[];
    failedProcesses: {
        launchId: number;
        command: string;
        pid: number;
        wrapperPid?: number;
        directory: string;
        error: string;
    }[];
    alreadyDeadProcesses: {
        launchId: number;
        command: string;
        pid: number;
        directory: string;
    }[];
    summary: {
        totalFound: number;
        killed: number;
        failed: number;
        alreadyDead: number;
    };
    message?: string;
}

export async function handleKillAll(): Promise<KillAllOutput> {
    // Get all running processes
    const runningProcesses = Db.getRunningProcesses();
    
    if (runningProcesses.length === 0) {
        return {
            killedProcesses: [],
            failedProcesses: [],
            alreadyDeadProcesses: [],
            summary: {
                totalFound: 0,
                killed: 0,
                failed: 0,
                alreadyDead: 0
            },
            message: 'No running processes found to kill.'
        };
    }
    
    const killedProcesses = [];
    const failedProcesses = [];
    const alreadyDeadProcesses = [];
    
    for (const server of runningProcesses) {
        try {
            // Check if process is actually running
            const isRunning = Db.isProcessRunning(server.pid);
            
            if (!isRunning) {
                alreadyDeadProcesses.push({
                    launchId: server.launch_id,
                    command: server.command_name,
                    pid: server.pid,
                    directory: server.working_directory
                });
                Db.setProcessExited(server.launch_id, -1);
                continue;
            }
            
            // Kill the main process
            process.kill(server.pid, 'SIGTERM');
            
            // Also kill the wrapper process if it exists
            if (server.wrapper_pid) {
                try {
                    process.kill(server.wrapper_pid, 'SIGTERM');
                } catch (error) {
                    // Wrapper process might already be dead, that's okay
                }
            }
            
            // Wait a moment and check if it's still running
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (Db.isProcessRunning(server.pid)) {
                // Force kill if SIGTERM didn't work
                process.kill(server.pid, 'SIGKILL');
                
                // Force kill wrapper process too
                if (server.wrapper_pid && Db.isProcessRunning(server.wrapper_pid)) {
                    try {
                        process.kill(server.wrapper_pid, 'SIGKILL');
                    } catch (error) {
                        // Ignore errors for wrapper process cleanup
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Update database status
            Db.setProcessExited(server.launch_id, -9); // SIGKILL exit code
            
            killedProcesses.push({
                launchId: server.launch_id,
                command: server.command_name,
                pid: server.pid,
                wrapperPid: server.wrapper_pid || undefined,
                directory: server.working_directory
            });
            
        } catch (error) {
            failedProcesses.push({
                launchId: server.launch_id,
                command: server.command_name,
                pid: server.pid,
                wrapperPid: server.wrapper_pid || undefined,
                directory: server.working_directory,
                error: error.message
            });
        }
    }
    
    return {
        killedProcesses,
        failedProcesses,
        alreadyDeadProcesses,
        summary: {
            totalFound: runningProcesses.length,
            killed: killedProcesses.length,
            failed: failedProcesses.length,
            alreadyDead: alreadyDeadProcesses.length
        }
    };
}

