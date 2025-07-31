import * as Db from './database';
import { killProcessTree } from './killProcessTree';

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
            if (!server.pid) {
                alreadyDeadProcesses.push({
                    launchId: server.launch_id,
                    command: server.command_name,
                    pid: server.pid,
                    directory: server.working_directory
                });
                Db.setProcessExited(server.launch_id, -1);
                continue;
            }

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
            await killProcessTree(server.pid);
            
            // Also kill the wrapper process if it exists
            if (server.wrapper_pid) {
                await killProcessTree(server.wrapper_pid);
            }
            
            // Wait a moment and check if it's still running
            await new Promise(resolve => setTimeout(resolve, 100));
            
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

export function printKillAllOutput(output: KillAllOutput): void {
    if (output.message) {
        console.log(output.message);
        return;
    }

    if (output.killedProcesses.length === 0 && output.failedProcesses.length === 0 && output.alreadyDeadProcesses.length === 0) {
        console.log('No running processes found to kill');
        return;
    }

    // Print killed processes
    if (output.killedProcesses.length > 0) {
        const headers = ['COMMAND', 'PID', 'WRAPPER PID', 'DIRECTORY'];
        const rows = output.killedProcesses.map(process => [
            process.command,
            process.pid.toString(),
            process.wrapperPid ? process.wrapperPid.toString() : '-',
            process.directory
        ]);

        const columnWidths = headers.map((header, i) => 
            Math.max(header.length, ...rows.map(row => row[i].length))
        );

        const formatRow = (row: string[]) => 
            row.map((cell, i) => cell.padEnd(columnWidths[i])).join('  ');

        console.log('Killed processes:');
        console.log(formatRow(headers));
        console.log(columnWidths.map(width => '-'.repeat(width)).join('  '));
        
        for (const row of rows) {
            console.log(formatRow(row));
        }
        console.log();
    }

    // Print failed processes
    if (output.failedProcesses.length > 0) {
        const headers = ['COMMAND', 'PID', 'DIRECTORY', 'ERROR'];
        const rows = output.failedProcesses.map(process => [
            process.command,
            process.pid.toString(),
            process.directory,
            process.error
        ]);

        const columnWidths = headers.map((header, i) => 
            Math.max(header.length, ...rows.map(row => row[i].length))
        );

        const formatRow = (row: string[]) => 
            row.map((cell, i) => cell.padEnd(columnWidths[i])).join('  ');

        console.log('Failed to kill:');
        console.log(formatRow(headers));
        console.log(columnWidths.map(width => '-'.repeat(width)).join('  '));
        
        for (const row of rows) {
            console.log(formatRow(row));
        }
        console.log();
    }

    // Print already dead processes
    if (output.alreadyDeadProcesses.length > 0) {
        const headers = ['COMMAND', 'PID', 'DIRECTORY'];
        const rows = output.alreadyDeadProcesses.map(process => [
            process.command,
            process.pid.toString(),
            process.directory
        ]);

        const columnWidths = headers.map((header, i) => 
            Math.max(header.length, ...rows.map(row => row[i].length))
        );

        const formatRow = (row: string[]) => 
            row.map((cell, i) => cell.padEnd(columnWidths[i])).join('  ');

        console.log('Already dead processes (cleaned up):');
        console.log(formatRow(headers));
        console.log(columnWidths.map(width => '-'.repeat(width)).join('  '));
        
        for (const row of rows) {
            console.log(formatRow(row));
        }
        console.log();
    }

    // Print summary
    console.log(`Summary: ${output.summary.totalFound} total, ${output.summary.killed} killed, ${output.summary.failed} failed, ${output.summary.alreadyDead} already dead`);
}

