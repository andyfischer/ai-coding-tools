import * as Db from './database';
import treeKill from 'tree-kill';
import { findSetupFile, findServiceByName, getServiceCwd } from './setupFile';

interface KillCommandOptions {
    projectDir: string; // Current working directory
    commandName: string; // Name of the command to kill
}   

export interface KillOutput {
    killedProcesses: {
        command: string;
        pid: number;
        wrapperPid?: number;
        directory: string;
    }[];
    directory: string;
    commandName: string;
    message?: string;
}

async function tryKillProcessTree(pid: number): Promise<boolean> {
    if (pid == null || pid == 0) {
        throw new Error(`internal error: tryKillProcessTree called with invalid PID: ${pid}`);
    }

    return new Promise((resolve) => {
        treeKill(pid, 'SIGTERM', (error: any) => {
            if (error && error.code === 'ESRCH') {
                // Process does not exist
                resolve(false);
            } else if (error) {
                console.warn(`Warning: Could not kill process tree for PID ${pid}:`, error.message);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

export async function handleKill(options: KillCommandOptions): Promise<KillOutput> {
    const { projectDir, commandName } = options;

    // Find running processes using projectDir and commandName
    const runningProcesses = Db.getRunningProcessesByProjectDir(projectDir);
    
    const killedProcesses = [];
    
    for (const process of runningProcesses) {
        if (commandName && process.command_name !== commandName) {
            continue;
        }

        // Kill the main process and its entire process tree
        if (process.pid) {
            await tryKillProcessTree(process.pid);
        }
        
        // Also kill the wrapper process tree if it exists
        if (process.wrapper_pid) {
            await tryKillProcessTree(process.wrapper_pid);
        }

        killedProcesses.push({
            command: process.command_name,
            pid: process.pid,
            wrapperPid: process.wrapper_pid || undefined,
            directory: process.working_directory
        });
    }

    if (killedProcesses.length === 0) {
        return {
            killedProcesses: [],
            directory: projectDir,
            commandName: commandName,
            message: `No running processes found for service '${commandName}' in project '${projectDir}'`
        };
    }

    return {
        killedProcesses,
        directory: projectDir,
        commandName: commandName,
    };
}

